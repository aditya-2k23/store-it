"use server";

import { avatarPlaceholderUrl } from "@/constants";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { parseStringify } from "../utils";
import type { Database } from "@/types/database.types";
import { cookies } from "next/headers";

import { cache } from "react";

const ACTIVE_WORKSPACE_COOKIE = "storey-active-workspace";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

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
      // Resolve active workspace: cookie first, then personal workspace fallback
      let workspaceId: string | undefined;

      // Try the active workspace cookie
      try {
        const cookieStore = await cookies();
        const activeWsCookie = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

        if (activeWsCookie) {
          // Verify the user is actually a member of this workspace
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
        // cookies() can throw in some contexts (e.g. generateStaticParams)
      }

      // Fallback: find their personal workspace
      if (!workspaceId) {
        const { data: personalWs } = await supabase
          .from("workspaces")
          .select("id")
          .eq("owner_id", existingUser.id)
          .eq("type", "personal")
          .maybeSingle();

        workspaceId = personalWs?.id;
      }

      // Final fallback: any workspace they own
      if (!workspaceId) {
        const { data: membership } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", existingUser.id)
          .eq("role", "owner")
          .maybeSingle();

        workspaceId = membership?.workspace_id;
      }

      if (workspaceId) {
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
    }

    // If user does not exist in Supabase yet, proceed with Clerk fetch & database setup
    const client = await clerkClient();
    const clerkUser =
      (await currentUser()) ?? (await client.users.getUser(userId));

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) throw new Error("Clerk user has no email address");

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
      .single();

    if (userError?.code === "23505") {
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUserError) throw existingUserError;

      const { data: mergedUser, error: mergeError } = await supabase
        .from("users")
        .update({ ...upsertPayload, clerk_id: userId })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (mergeError) throw mergeError;

      user = mergedUser;
    } else if (userError) {
      throw userError;
    } else {
      user = upsertedUser;
    }

    if (!user) {
      throw new Error("User upsert failed");
    }

    const { data: existingWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("type", "personal")
      .maybeSingle();

    if (workspaceError) throw workspaceError;

    let workspaceId = existingWorkspace?.id;

    if (!workspaceId) {
      const { data: newWorkspace, error: createWorkspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: `${fullName}'s Workspace`,
          type: "personal",
          owner_id: user.id,
        })
        .select("id")
        .single();

      if (createWorkspaceError) throw createWorkspaceError;

      workspaceId = newWorkspace.id;
    }

    const { error: membershipError } = await supabase
      .from("workspace_members")
      .upsert(
        {
          workspace_id: workspaceId,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "workspace_id,user_id" },
      );

    if (membershipError) throw membershipError;

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
    handleError(error, "Failed to get current user");
  }
});
