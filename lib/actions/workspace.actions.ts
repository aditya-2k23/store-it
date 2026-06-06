"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { parseStringify } from "@/lib/utils";
import { getCurrentUser } from "./user.actions";
import { cookies } from "next/headers";
import {
  canInvite,
  canManageMembers,
  canManageWorkspace,
  canChangeRole,
  canRemoveMember,
  type WorkspaceRole,
} from "@/lib/permissions";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

const ACTIVE_WORKSPACE_COOKIE = "storey-active-workspace";
const MAX_TEAM_WORKSPACES = 5;

/**
 * Generate a URL-safe slug from a workspace name.
 * lowercase, spaces → hyphens, strip non-alphanumeric except hyphens.
 */
function generateSlugBase(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensure slug uniqueness by appending -2, -3 etc. if needed.
 */
async function ensureUniqueSlug(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  baseSlug: string,
  excludeWorkspaceId?: string,
): Promise<string> {
  let slug = baseSlug || "workspace";
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = suffix === 1 ? slug : `${slug}-${suffix}`;
    let query = supabase
      .from("workspaces")
      .select("id")
      .eq("slug", candidate)
      .limit(1);

    if (excludeWorkspaceId) {
      query = query.neq("id", excludeWorkspaceId);
    }

    const { data } = await query;

    if (!data || data.length === 0) {
      return candidate;
    }
    suffix++;
  }
}

/**
 * Fetch the caller's role in a workspace. Returns null if not a member.
 */
async function getCallerRole(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as WorkspaceRole) ?? null;
}

// Workspace CRUD
export const createWorkspace = async (name: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Count team workspaces owned by this user
    const { count, error: countError } = await supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("role", "owner")
      .in(
        "workspace_id",
        (
          await supabase
            .from("workspaces")
            .select("id")
            .eq("type", "team")
            .eq("owner_id", currentUser.id)
        ).data?.map((w) => w.id) ?? [],
      );

    if (countError) throw countError;
    if ((count ?? 0) >= MAX_TEAM_WORKSPACES) {
      throw new Error("Team workspace limit reached (max 5)");
    }

    // Generate unique slug
    const slugBase = generateSlugBase(name);
    const slug = await ensureUniqueSlug(supabase, slugBase);

    // Insert workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({
        name: name.trim(),
        slug,
        type: "team",
        owner_id: currentUser.id,
      })
      .select()
      .single();

    if (wsError) throw wsError;

    // Insert owner membership
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: currentUser.id,
        role: "owner",
      });

    if (memberError) throw memberError;

    return parseStringify(workspace);
  } catch (error) {
    handleError(error, "Failed to create workspace");
  }
};

export const getUserWorkspaces = async () => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Fetch all memberships with workspace data
    const { data: memberships, error } = await supabase
      .from("workspace_members")
      .select(
        "role, workspace_id, workspaces(id, name, slug, type, owner_id, storage_limit, storage_used, created_at, updated_at)",
      )
      .eq("user_id", currentUser.id);

    if (error) throw error;

    if (!memberships || memberships.length === 0) return [];

    // Get member counts for all workspace IDs
    const workspaceIds = memberships.map((m) => m.workspace_id);
    const { data: memberCounts, error: countError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .in("workspace_id", workspaceIds);

    if (countError) throw countError;

    const countMap = new Map<string, number>();
    (memberCounts || []).forEach((row) => {
      countMap.set(row.workspace_id, (countMap.get(row.workspace_id) || 0) + 1);
    });

    // Map to WorkspaceWithRole
    const workspaces: WorkspaceWithRole[] = memberships
      .filter((m) => m.workspaces)
      .map((m) => {
        const ws = m.workspaces as any;
        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          type: ws.type,
          ownerId: ws.owner_id,
          storageLimit: ws.storage_limit,
          storageUsed: ws.storage_used,
          createdAt: ws.created_at,
          updatedAt: ws.updated_at,
          role: m.role as WorkspaceRole,
          memberCount: countMap.get(ws.id) || 1,
        };
      });

    // Sort: personal first, then team by created_at asc
    workspaces.sort((a, b) => {
      if (a.type === "personal" && b.type !== "personal") return -1;
      if (a.type !== "personal" && b.type === "personal") return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return parseStringify(workspaces);
  } catch (error) {
    handleError(error, "Failed to get user workspaces");
  }
};

// Active Workspace Cookie
export const setActiveWorkspace = async (workspaceId: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Verify membership
    const role = await getCallerRole(supabase, currentUser.id, workspaceId);
    if (!role) throw new Error("You are not a member of this workspace");

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return parseStringify({ success: true });
  } catch (error) {
    handleError(error, "Failed to set active workspace");
  }
};

export const getActiveWorkspaceId = async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
};

// Workspace Management
export const renameWorkspace = async (workspaceId: string, name: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const role = await getCallerRole(supabase, currentUser.id, workspaceId);
    if (!canManageWorkspace(role!)) {
      throw new Error("Only the owner can rename a workspace");
    }

    const slugBase = generateSlugBase(name);
    const slug = await ensureUniqueSlug(supabase, slugBase, workspaceId);

    const { data, error } = await supabase
      .from("workspaces")
      .update({ name: name.trim(), slug, updated_at: new Date().toISOString() })
      .eq("id", workspaceId)
      .select()
      .single();

    if (error) throw error;

    return parseStringify(data);
  } catch (error) {
    handleError(error, "Failed to rename workspace");
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const role = await getCallerRole(supabase, currentUser.id, workspaceId);
    if (!canManageWorkspace(role!)) {
      throw new Error("Only the owner can delete a workspace");
    }

    // Verify it's a team workspace
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("type")
      .eq("id", workspaceId)
      .single();

    if (wsError) throw wsError;
    if (ws.type === "personal") {
      throw new Error("Personal workspaces cannot be deleted");
    }

    // Delete all files from R2 storage first
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("storage_key, thumbnail_key")
      .eq("workspace_id", workspaceId);

    if (filesError) throw filesError;

    if (files && files.length > 0) {
      const keysToDelete = files
        .flatMap((f) => [f.storage_key, f.thumbnail_key])
        .filter(Boolean) as string[];

      if (keysToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
          .remove(keysToDelete);

        if (storageError) {
          console.error("Failed to delete R2 objects:", storageError);
          // Continue with workspace deletion — orphaned objects are preferable
          // to blocking the deletion flow
        }
      }

      // Delete file rows
      const { error: deleteFilesError } = await supabase
        .from("files")
        .delete()
        .eq("workspace_id", workspaceId);

      if (deleteFilesError) throw deleteFilesError;
    }

    // Delete the workspace (cascade handles members + invitations)
    const { error: deleteError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (deleteError) throw deleteError;

    // Clear cookie if this was the active workspace
    const activeId = await getActiveWorkspaceId();
    if (activeId === workspaceId) {
      const cookieStore = await cookies();
      cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
    }

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to delete workspace");
  }
};

// Membership Management
export const leaveWorkspace = async (workspaceId: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const role = await getCallerRole(supabase, currentUser.id, workspaceId);
    if (!role) throw new Error("You are not a member of this workspace");

    if (role === "owner") {
      throw new Error("Transfer ownership before leaving");
    }

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", currentUser.id);

    if (error) throw error;

    // Clear cookie if this was the active workspace
    const activeId = await getActiveWorkspaceId();
    if (activeId === workspaceId) {
      const cookieStore = await cookies();
      cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
    }

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to leave workspace");
  }
};

export const transferOwnership = async (
  workspaceId: string,
  newOwnerId: string,
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const callerRole = await getCallerRole(
      supabase,
      currentUser.id,
      workspaceId,
    );
    if (callerRole !== "owner") {
      throw new Error("Only the owner can transfer ownership");
    }

    // Verify new owner is a member
    const newOwnerRole = await getCallerRole(supabase, newOwnerId, workspaceId);
    if (!newOwnerRole) {
      throw new Error("Target user is not a member of this workspace");
    }

    // Atomic transaction using RPC function
    const { error: txError } = await supabase.rpc("transfer_workspace_ownership", {
      p_workspace_id: workspaceId,
      p_old_owner_id: currentUser.id,
      p_new_owner_id: newOwnerId,
    });

    if (txError) throw txError;

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to transfer ownership");
  }
};

export const getWorkspaceMembers = async (workspaceId: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Verify caller is a member
    const role = await getCallerRole(supabase, currentUser.id, workspaceId);
    if (!role) throw new Error("You are not a member of this workspace");

    const { data, error } = await supabase
      .from("workspace_members")
      .select(
        "id, user_id, workspace_id, role, joined_at, users:user_id(id, full_name, email, avatar_url)",
      )
      .eq("workspace_id", workspaceId);

    if (error) throw error;

    const members: WorkspaceMember[] = (data || []).map((row) => {
      const user = row.users as any;
      return {
        id: row.id,
        userId: row.user_id,
        workspaceId: row.workspace_id,
        role: row.role as WorkspaceRole,
        joinedAt: row.joined_at,
        user: {
          id: user?.id || row.user_id,
          fullName: user?.full_name || null,
          email: user?.email || "",
          avatarUrl: user?.avatar_url || null,
        },
      };
    });

    return parseStringify(members);
  } catch (error) {
    handleError(error, "Failed to get workspace members");
  }
};

export const updateMemberRole = async (
  workspaceId: string,
  targetUserId: string,
  newRole: string,
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const callerRole = await getCallerRole(
      supabase,
      currentUser.id,
      workspaceId,
    );
    if (!callerRole || !canManageMembers(callerRole)) {
      throw new Error("You do not have permission to change roles");
    }

    const targetRole = await getCallerRole(supabase, targetUserId, workspaceId);
    if (!targetRole) throw new Error("Target user is not a member");

    if (!canChangeRole(callerRole, targetRole, newRole as WorkspaceRole)) {
      throw new Error("You do not have permission to assign this role");
    }

    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId);

    if (error) throw error;

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to update member role");
  }
};

export const removeMember = async (
  workspaceId: string,
  targetUserId: string,
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const callerRole = await getCallerRole(
      supabase,
      currentUser.id,
      workspaceId,
    );
    if (!callerRole || !canManageMembers(callerRole)) {
      throw new Error("You do not have permission to remove members");
    }

    const targetRole = await getCallerRole(supabase, targetUserId, workspaceId);
    if (!targetRole) throw new Error("Target user is not a member");

    if (!canRemoveMember(callerRole, targetRole)) {
      throw new Error("You do not have permission to remove this member");
    }

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId);

    if (error) throw error;

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to remove member");
  }
};

// Invite Links
export const createInviteLink = async (
  workspaceId: string,
  role: "admin" | "editor" | "viewer",
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const callerRole = await getCallerRole(
      supabase,
      currentUser.id,
      workspaceId,
    );
    if (!callerRole || !canInvite(callerRole)) {
      throw new Error("You do not have permission to generate invite links");
    }

    const { data, error } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: workspaceId,
        invited_by: currentUser.id,
        role,
      })
      .select()
      .single();

    if (error) throw error;

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.token}`;

    return parseStringify({
      ...data,
      inviteUrl,
    });
  } catch (error) {
    handleError(error, "Failed to create invite link");
  }
};

export const revokeInviteLink = async (invitationId: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Fetch the invitation to get workspace_id
    const { data: invitation, error: fetchError } = await supabase
      .from("workspace_invitations")
      .select("workspace_id")
      .eq("id", invitationId)
      .single();

    if (fetchError) throw fetchError;

    const callerRole = await getCallerRole(
      supabase,
      currentUser.id,
      invitation.workspace_id,
    );
    if (!callerRole || !canInvite(callerRole)) {
      throw new Error("You do not have permission to revoke invite links");
    }

    const { error } = await supabase
      .from("workspace_invitations")
      .update({ status: "revoked" })
      .eq("id", invitationId);

    if (error) throw error;

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to revoke invite link");
  }
};

export const getWorkspaceInvitations = async (workspaceId: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const callerRole = await getCallerRole(supabase, currentUser.id, workspaceId);
    if (!callerRole || !canInvite(callerRole)) {
      throw new Error("You do not have permission to view invitations");
    }

    const { data, error } = await supabase
      .from("workspace_invitations")
      .select("id, workspace_id, invited_by, role, token, status, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    return parseStringify(
      (data || []).map((inv) => ({
        id: inv.id,
        workspaceId: inv.workspace_id,
        invitedBy: inv.invited_by,
        role: inv.role,
        token: inv.token,
        status: inv.status,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      })),
    );
  } catch (error) {
    handleError(error, "Failed to get workspace invitations");
  }
};

export const validateInviteToken = async (token: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const { data: invitation, error } = await supabase
      .from("workspace_invitations")
      .select(
        "id, workspace_id, role, status, expires_at, workspaces(id, name)",
      )
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;

    if (!invitation) {
      return parseStringify({ valid: false, reason: "Invite not found" });
    }

    if (invitation.status !== "pending") {
      return parseStringify({
        valid: false,
        reason:
          invitation.status === "accepted"
            ? "This invite has already been used"
            : "This invite has been revoked",
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return parseStringify({
        valid: false,
        reason: "This invite link has expired",
      });
    }

    const ws = invitation.workspaces as any;

    return parseStringify({
      valid: true,
      workspaceName: ws?.name || "Unknown",
      role: invitation.role,
      workspaceId: invitation.workspace_id,
      invitationId: invitation.id,
    });
  } catch (error) {
    handleError(error, "Failed to validate invite token");
  }
};

export const acceptInvite = async (token: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Validate the token
    const validation = await validateInviteToken(token);
    if (!validation?.valid) {
      throw new Error(validation?.reason || "Invalid invite");
    }

    const { workspaceId, role, invitationId } = validation;

    // Check if already a member
    const existingRole = await getCallerRole(
      supabase,
      currentUser.id,
      workspaceId,
    );
    if (existingRole) {
      throw new Error("You are already a member of this workspace");
    }

    // Atomic check-and-set of the invitation status to prevent double-acceptance
    const { data: updatedInvitation, error: updateError } = await supabase
      .from("workspace_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (updateError || !updatedInvitation) {
      throw new Error("This invite has already been accepted or is no longer valid.");
    }

    // Insert membership
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: currentUser.id,
        role,
      });

    if (memberError) {
      // Rollback invitation status if membership insert fails
      await supabase
        .from("workspace_invitations")
        .update({ status: "pending" })
        .eq("id", invitationId);
      throw memberError;
    }

    // Set as active workspace
    await setActiveWorkspace(workspaceId);

    return parseStringify({ workspaceId });
  } catch (error) {
    handleError(error, "Failed to accept invite");
  }
};
