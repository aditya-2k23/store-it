export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

const ROLE_LEVELS: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/** owner, admin, editor */
export function canUpload(role: WorkspaceRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS.editor;
}

/** owner, admin */
export function canDeleteOthers(role: WorkspaceRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS.admin;
}

/** owner, admin */
export function canInvite(role: WorkspaceRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS.admin;
}

/** owner, admin */
export function canManageMembers(role: WorkspaceRole): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS.admin;
}

/** owner only */
export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

/**
 * Check if `actorRole` can change `targetRole` to `newRole`.
 * - Owner can change any non-owner role to any non-owner role.
 * - Admin can only change editor/viewer roles to editor/viewer.
 * - Editor and viewer cannot change roles.
 */
export function canChangeRole(
  actorRole: WorkspaceRole,
  targetCurrentRole: WorkspaceRole,
  newRole: WorkspaceRole,
): boolean {
  if (targetCurrentRole === "owner" || newRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") {
    return (
      targetCurrentRole !== "admin" &&
      newRole !== "admin"
    );
  }
  return false;
}

/**
 * Check if `actorRole` can remove a member with `targetRole`.
 * - Owner can remove anyone except themselves (handled at call site).
 * - Admin can remove editor/viewer — not owner or other admins.
 * - Editor and viewer cannot remove anyone.
 */
export function canRemoveMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
): boolean {
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") {
    return targetRole !== "admin";
  }
  return false;
}
