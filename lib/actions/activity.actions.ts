"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { parseStringify } from "@/lib/utils";
import { getCurrentUser } from "./user.actions";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

/**
 * Internal fire-and-forget helper. Inserts one row into activity_logs.
 * NEVER throws — all errors are caught and console.error'd internally.
 * Callers do not need their own try/catch around logActivity().
 */
async function logActivity(params: {
  userId: string | null;
  workspaceId: string | null;
  fileId?: string | null;
  folderId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("activity_logs").insert({
      user_id: params.userId,
      workspace_id: params.workspaceId,
      file_id: params.fileId ?? null,
      folder_id: params.folderId ?? null,
      action: params.action,
      metadata: (params.metadata ?? null) as unknown as import("@/types/database.types").Json | null,
    });
    if (error) {
      console.error("[logActivity] Failed to insert activity log:", error);
    }
  } catch (err) {
    console.error("[logActivity] Unexpected error inserting activity log:", err);
  }
}

export { logActivity };

/**
 * Validates that a cursor object has a real ISO date string and a UUID v4 id.
 * Invalid cursors are silently ignored (pagination resets to first page).
 */
function isValidCursor(
  cursor: unknown,
): cursor is { createdAt: string; id: string } {
  if (!cursor || typeof cursor !== "object") return false;
  const c = cursor as { createdAt?: unknown; id?: unknown };
  if (typeof c.createdAt !== "string" || typeof c.id !== "string") return false;
  if (isNaN(new Date(c.createdAt).getTime())) return false;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      c.id,
    )
  )
    return false;
  return true;
}

/**
 * Returns a paginated list of activity log entries for the given workspace.
 * The caller must be a member of the workspace.
 *
 * Pagination is cursor-based using (createdAt, id) for stable ordering even
 * when multiple rows share the same created_at timestamp.
 */
export type ActivityCategory = "all" | "files" | "members" | "workspace";

/**
 * Returns a paginated list of activity log entries for the given workspace.
 * The caller must be a member of the workspace.
 *
 * Pagination is cursor-based using (createdAt, id) for stable ordering even
 * when multiple rows share the same created_at timestamp.
 */
export const getWorkspaceActivity = async (
  workspaceId: string,
  cursor?: { createdAt: string; id: string },
  limit: number = 5,
  category: ActivityCategory = "all",
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Verify caller is a member of the workspace
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!membership) throw new Error("You are not a member of this workspace");

    // Build base query
    let query = supabase
      .from("activity_logs")
      .select(
        "id, user_id, workspace_id, file_id, folder_id, action, metadata, created_at",
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (category === "files") {
      query = query.like("action", "file.%");
    } else if (category === "members") {
      query = query.like("action", "workspace.member.%");
    } else if (category === "workspace") {
      // For workspace, we want workspace actions but not member actions
      // Supabase's `not` is a bit limited for wildcards in this specific pattern,
      // but we can use `like` and `not` carefully.
      query = query.like("action", "workspace.%").not("action", "like", "workspace.member.%");
    }

    // Apply cursor for pagination — rows strictly before the cursor position
    // using both created_at and id as tie-breaker for stability.
    // Cursor is validated before use to guard against malformed input from
    // the Server Action boundary (invalid cursor silently resets to page 1).
    if (cursor && isValidCursor(cursor)) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];

    const items: ActivityLogItem[] = rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      fileId: row.file_id,
      folderId: row.folder_id,
      action: row.action,
      metadata: row.metadata ?? null,
      createdAt: row.created_at,
    }));

    const nextCursor =
      rows.length === limit
        ? {
            createdAt: rows[rows.length - 1].created_at,
            id: rows[rows.length - 1].id,
          }
        : null;

    return parseStringify({ items, nextCursor });
  } catch (error) {
    handleError(error, "Failed to get workspace activity");
  }
};
