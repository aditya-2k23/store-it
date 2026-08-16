"use server";

import { avatarPlaceholderUrl } from "@/constants";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { parseStringify, escapeLikePattern } from "../utils";
import type { Database } from "@/types/database.types";
import { cookies } from "next/headers";
import { cache } from "react";

const ACTIVE_WORKSPACE_COOKIE = "storey-active-workspace";

async function ensurePersonalWorkspace(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  userName: string | null,
): Promise<string> {
  // 1. Check if personal workspace already exists by owner_id
  const { data: personalWs } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .eq("type", "personal")
    .maybeSingle();

  if (personalWs?.id) {
    // Ensure membership exists
    const { error: membershipError } = await supabase
      .from("workspace_members")
      .upsert(
        {
          workspace_id: personalWs.id,
          user_id: userId,
          role: "owner",
        },
        { onConflict: "workspace_id,user_id" },
      );

    if (membershipError) throw membershipError;
    return personalWs.id;
  }

  // 2. Check if user already has any workspace membership (e.g. provisioned concurrently by webhook)
  const { data: existingMember, error: existingMemberError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingMemberError) throw existingMemberError;

  if (existingMember?.workspace_id) {
    return existingMember.workspace_id;
  }

  // 3. Attempt to insert personal workspace
  const { data: newWorkspace, error: createError } = await supabase
    .from("workspaces")
    .insert({
      name: userName ? `${userName}'s Workspace` : "My Workspace",
      type: "personal",
      owner_id: userId,
    })
    .select("id")
    .maybeSingle();

  let workspaceId = newWorkspace?.id;

  if (!workspaceId) {
    // Retry finding personal workspace or membership with small backoff in case webhook created it concurrently
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));

      const { data: retryWs } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", userId)
        .eq("type", "personal")
        .maybeSingle();

      if (retryWs?.id) {
        workspaceId = retryWs.id;
        break;
      }

      const { data: retryMember } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (retryMember?.workspace_id) {
        workspaceId = retryMember.workspace_id;
        break;
      }
    }
  }

  if (!workspaceId) {
    console.error(
      "ensurePersonalWorkspace: could not create or find workspace",
      {
        userId,
        createError,
      },
    );
    throw new Error("Failed to create or find personal workspace");
  }

  // 4. Ensure membership
  const { error: membershipError } = await supabase
    .from("workspace_members")
    .upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
      },
      { onConflict: "workspace_id,user_id" },
    );

  if (membershipError) throw membershipError;

  return workspaceId;
}

export const getCurrentUser = cache(async () => {
  try {
    const { userId } = await auth();

    if (!userId) return null;

    const supabase = createSupabaseAdmin();

    // 1. Fetch user from Supabase first
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (findError) throw findError;

    if (existingUser) {
      // Resolve active workspace: cookie first if member, then ensure personal workspace
      let workspaceId: string | undefined;

      try {
        const cookieStore = await cookies();
        const activeWsCookie = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

        if (activeWsCookie) {
          const { data: cookieMembership } = await supabase
            .from("workspace_members")
            .select("workspace_id")
            .eq("user_id", existingUser.id)
            .eq("workspace_id", activeWsCookie)
            .maybeSingle();

          if (cookieMembership?.workspace_id) {
            workspaceId = cookieMembership.workspace_id;
          }
        }
      } catch {
        // cookies() can throw in some static contexts
      }

      if (!workspaceId) {
        workspaceId = await ensurePersonalWorkspace(
          supabase,
          existingUser.id,
          existingUser.full_name,
        );
      }

      return parseStringify({
        id: existingUser.id,
        clerkId: existingUser.clerk_id,
        email: existingUser.email,
        fullName: existingUser.full_name,
        avatarUrl: existingUser.avatar_url,
        username: existingUser.username,
        plan: existingUser.plan,
        workspaceId,
      });
    }

    // 2. If user does not exist in Supabase yet, fetch Clerk user & set up database records
    const client = await clerkClient();
    const clerkUser =
      (await currentUser()) ?? (await client.users.getUser(userId));

    const rawEmail =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!rawEmail) throw new Error("Clerk user has no email address");

    const email = rawEmail.toLowerCase();

    const username =
      clerkUser.username || (email.includes("@") ? email.split("@")[0] : null);

    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      username ||
      "User";

    const avatarUrl = clerkUser.imageUrl || avatarPlaceholderUrl;

    const upsertPayload: Database["public"]["Tables"]["users"]["Insert"] = {
      clerk_id: userId,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      username,
    };

    let user: Database["public"]["Tables"]["users"]["Row"] | null = null;

    const { data: upsertedUser, error: userError } = await supabase
      .from("users")
      .upsert(upsertPayload, { onConflict: "clerk_id" })
      .select()
      .maybeSingle();

    if (userError?.code === "23505") {
      // Conflict on email — find existing row and update with new clerk_id
      const { data: byEmail, error: emailLookupErr } = await supabase
        .from("users")
        .select("id")
        .ilike("email", escapeLikePattern(email))
        .maybeSingle();

      if (emailLookupErr) throw emailLookupErr;

      if (byEmail?.id) {
        const { data: mergedUser, error: mergeError } = await supabase
          .from("users")
          .update({ ...upsertPayload, clerk_id: userId })
          .eq("id", byEmail.id)
          .select()
          .single();

        if (mergeError) throw mergeError;
        user = mergedUser;
      }
    } else if (userError) {
      throw userError;
    } else {
      user = upsertedUser;
    }

    if (!user) {
      // Final fallback query by clerk_id
      const { data: finalUser } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", userId)
        .maybeSingle();

      user = finalUser;
    }

    if (!user) {
      throw new Error(`Failed to provision user for clerk_id=${userId}`);
    }

    const workspaceId = await ensurePersonalWorkspace(
      supabase,
      user.id,
      user.full_name,
    );

    return parseStringify({
      id: user.id,
      clerkId: user.clerk_id,
      email: user.email,
      fullName: user.full_name || fullName,
      avatarUrl: user.avatar_url || avatarUrl,
      username: user.username || username,
      plan: user.plan,
      workspaceId,
    });
  } catch (error) {
    console.error("Failed to get current user", error);
    return null;
  }
});
