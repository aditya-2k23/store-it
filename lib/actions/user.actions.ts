"use server";

import { avatarPlaceholderUrl } from "@/constants";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { parseStringify } from "../utils";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

export const getCurrentUser = async () => {
  try {
    const { userId } = await auth();

    if (!userId) return null;

    const client = await clerkClient();
    const clerkUser =
      (await currentUser()) ?? (await client.users.getUser(userId));

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) throw new Error("Clerk user has no email address");

    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "User";

    const avatarUrl = clerkUser.imageUrl || avatarPlaceholderUrl;

    const supabase = createSupabaseAdmin();

    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: userId,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
        },
        { onConflict: "clerk_id" },
      )
      .select()
      .single();

    if (userError) throw userError;

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
      plan: user.plan,
      workspaceId,
    });
  } catch (error) {
    handleError(error, "Failed to get current user");
  }
};
