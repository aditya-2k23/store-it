"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";
import { logActivity } from "./activity.actions";
import {
  canDeleteOthers,
  canModifyOthersFiles,
  canUpload,
  type WorkspaceRole,
} from "@/lib/permissions";
import { FILE_SELECT, mapRowToFileItem } from "@/lib/file-item.helpers";
import type { Database } from "@/types/database.types";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

type FolderRow = Database["public"]["Tables"]["folders"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

type FolderRowWithOwner = FolderRow & {
  owner?: Pick<UserRow, "id" | "full_name" | "email" | "avatar_url"> | null;
};

const FOLDER_SELECT =
  "*, owner:users!folders_created_by_fkey(id, full_name, email, avatar_url)";

type FolderActionRecord = Pick<
  FolderRow,
  "id" | "name" | "created_by" | "workspace_id" | "is_trashed"
>;
type FolderCapability = "modify" | "delete";

const assertCanActOnFolder = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  currentUser: CurrentUser,
  folderRecord: FolderActionRecord,
  capability: FolderCapability = "delete",
) => {
  if (folderRecord.created_by === currentUser.id) return;

  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", currentUser.id)
    .eq("workspace_id", folderRecord.workspace_id)
    .maybeSingle();

  if (error) throw error;
  const role = membership?.role as WorkspaceRole | undefined;
  if (!role) {
    throw new Error("Not authorized to act on this folder.");
  }

  const isAllowed =
    capability === "modify"
      ? canModifyOthersFiles(role)
      : canDeleteOthers(role);

  if (!isAllowed) {
    throw new Error("Not authorized to act on this folder.");
  }
};

const requireUploadPermission = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  currentUser: CurrentUser,
) => {
  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", currentUser.id)
    .eq("workspace_id", currentUser.workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!membership?.role || !canUpload(membership.role as WorkspaceRole)) {
    throw new Error(
      "You do not have permission to create or move folders in this workspace",
    );
  }
};

const mapFolderRow = (
  row: FolderRowWithOwner,
  fileCount = 0,
  itemCount = 0,
): FolderItem => ({
  id: row.id,
  name: row.name,
  parentFolderId: row.parent_folder_id,
  path: row.path || row.id,
  depth: row.depth,
  isTrashed: row.is_trashed,
  trashedAt: row.trashed_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  owner: row.owner
    ? {
        id: row.owner.id,
        fullName: row.owner.full_name || "Unknown",
        email: row.owner.email || "",
        avatarUrl: row.owner.avatar_url || null,
      }
    : undefined,
  fileCount,
  itemCount,
});

const mapFoldersWithCounts = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceId: string,
  folders: FolderRowWithOwner[],
) => {
  const folderIds = folders.map((folder) => folder.id);
  if (folderIds.length === 0) return [] as FolderItem[];

  const [childFoldersResult, filesResult] = await Promise.all([
    supabase
      .from("folders")
      .select("parent_folder_id")
      .eq("workspace_id", workspaceId)
      .in("parent_folder_id", folderIds),
    supabase
      .from("files")
      .select("folder_id")
      .eq("workspace_id", workspaceId)
      .in("folder_id", folderIds),
  ]);
  if (childFoldersResult.error) throw childFoldersResult.error;
  if (filesResult.error) throw filesResult.error;

  const childFolderCounts = new Map<string, number>();
  const fileCounts = new Map<string, number>();
  (childFoldersResult.data || []).forEach((folder) => {
    if (folder.parent_folder_id) {
      childFolderCounts.set(
        folder.parent_folder_id,
        (childFolderCounts.get(folder.parent_folder_id) || 0) + 1,
      );
    }
  });
  (filesResult.data || []).forEach((file) => {
    if (file.folder_id) {
      fileCounts.set(file.folder_id, (fileCounts.get(file.folder_id) || 0) + 1);
    }
  });

  return folders.map((folder) => {
    const fileCount = fileCounts.get(folder.id) || 0;
    return mapFolderRow(
      folder,
      fileCount,
      fileCount + (childFolderCounts.get(folder.id) || 0),
    );
  });
};

const getFolderActionRecord = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  folderId: string,
) => {
  const { data, error } = await supabase
    .from("folders")
    .select("id, name, created_by, workspace_id, is_trashed")
    .eq("id", folderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Folder not found");
  return data as FolderActionRecord;
};

export const createFolder = async (
  name: string,
  parentFolderId: string | null,
  path: string,
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");
    const folderName = name.trim();
    if (!folderName) throw new Error("Folder name is required");

    await requireUploadPermission(supabase, currentUser);

    let parentPath: string | null = null;
    let parentDepth = -1;
    if (parentFolderId) {
      const { data: parent, error: parentError } = await supabase
        .from("folders")
        .select("path, depth, workspace_id, is_trashed")
        .eq("id", parentFolderId)
        .maybeSingle();
      if (parentError) throw parentError;
      if (
        !parent ||
        parent.workspace_id !== currentUser.workspaceId ||
        parent.is_trashed
      ) {
        throw new Error("Parent folder is unavailable");
      }
      parentPath = parent.path ?? parentFolderId;
      parentDepth = parent.depth;
    }

    const folderId = crypto.randomUUID();
    const folderPath = parentPath
      ? `${parentPath}/${folderId}`
      : folderId;
    const { error: insertError } = await supabase.from("folders").insert({
      id: folderId,
      name: folderName,
      parent_folder_id: parentFolderId,
      workspace_id: currentUser.workspaceId,
      created_by: currentUser.id,
      path: folderPath,
      depth: parentDepth + 1,
    });
    if (insertError) throw insertError;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: currentUser.workspaceId,
      folderId,
      action: "folder.create",
      metadata: {
        folderName,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to create folder");
  }
};

export const renameFolder = async (
  folderId: string,
  name: string,
  path: string,
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");
    const folderName = name.trim();
    if (!folderName) throw new Error("Folder name is required");

    const folderRecord = await getFolderActionRecord(supabase, folderId);
    if (folderRecord.workspace_id !== currentUser.workspaceId) {
      throw new Error("Folder not found in this workspace");
    }
    if (folderRecord.is_trashed) {
      throw new Error("Cannot rename a trashed folder.");
    }
    await assertCanActOnFolder(supabase, currentUser, folderRecord, "modify");

    const { error: updateError } = await supabase
      .from("folders")
      .update({ name: folderName, updated_at: new Date().toISOString() })
      .eq("id", folderId);
    if (updateError) throw updateError;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: folderRecord.workspace_id,
      folderId,
      action: "folder.rename",
      metadata: {
        oldName: folderRecord.name,
        newName: folderName,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to rename folder");
  }
};

export const moveFolder = async (
  folderId: string,
  newParentFolderId: string | null,
  path: string,
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");
    await requireUploadPermission(supabase, currentUser);

    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("name, parent_folder_id, workspace_id, is_trashed")
      .eq("id", folderId)
      .maybeSingle();
    if (folderError) throw folderError;
    if (!folder || folder.workspace_id !== currentUser.workspaceId || folder.is_trashed) {
      throw new Error("Folder not found in this workspace or is trashed");
    }

    const [oldParentResult, newParentResult] = await Promise.all([
      folder.parent_folder_id
        ? supabase.from("folders").select("name").eq("id", folder.parent_folder_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      newParentFolderId
        ? supabase.from("folders").select("name").eq("id", newParentFolderId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (oldParentResult.error) throw oldParentResult.error;
    if (newParentResult.error) throw newParentResult.error;

    const { error: rpcError } = await supabase.rpc("move_folder", {
      p_folder_id: folderId,
      p_new_parent_folder_id: newParentFolderId,
      p_workspace_id: currentUser.workspaceId,
    });
    if (rpcError) throw rpcError;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: currentUser.workspaceId,
      folderId,
      action: "folder.move",
      metadata: {
        folderName: folder.name,
        fromFolderName: oldParentResult.data?.name || "Workspace Root",
        toFolderName: newParentResult.data?.name || "Workspace Root",
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to move folder");
  }
};

export const trashFolder = async (folderId: string, path: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");
    const folderRecord = await getFolderActionRecord(supabase, folderId);
    if (folderRecord.workspace_id !== currentUser.workspaceId) {
      throw new Error("Folder not found in this workspace");
    }
    await assertCanActOnFolder(supabase, currentUser, folderRecord, "delete");
    if (folderRecord.is_trashed) throw new Error("Folder is already in trash");

    const { error: rpcError } = await supabase.rpc("cascade_trash_folder", {
      p_folder_id: folderId,
      p_workspace_id: currentUser.workspaceId,
    });
    if (rpcError) throw rpcError;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: folderRecord.workspace_id,
      folderId,
      action: "folder.trash",
      metadata: {
        folderName: folderRecord.name,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to move folder to trash");
  }
};

export const restoreFolder = async (folderId: string, path: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");
    const folderRecord = await getFolderActionRecord(supabase, folderId);
    if (folderRecord.workspace_id !== currentUser.workspaceId) {
      throw new Error("Folder not found in this workspace");
    }
    await assertCanActOnFolder(supabase, currentUser, folderRecord, "delete");
    if (!folderRecord.is_trashed) throw new Error("Folder is not in trash");

    const { error: rpcError } = await supabase.rpc("cascade_restore_folder", {
      p_folder_id: folderId,
      p_workspace_id: currentUser.workspaceId,
    });
    if (rpcError) throw rpcError;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: folderRecord.workspace_id,
      folderId,
      action: "folder.restore",
      metadata: {
        folderName: folderRecord.name,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });
    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to restore folder");
  }
};

const sortItems = <
  T extends { name: string; size?: number; createdAt?: string; created_at?: string },
>(
  items: T[],
  sort: string,
): T[] => {
  const [rawSortBy, rawOrderBy] = (sort || "created_at-desc").split("-");
  const sortBy = rawSortBy === "$createdAt" ? "created_at" : rawSortBy;
  const multiplier = rawOrderBy === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name) * multiplier;
      case "size":
        return ((a.size || 0) - (b.size || 0)) * multiplier;
      case "created_at":
      default: {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return (dateA - dateB) * multiplier;
      }
    }
  });
};

export const getFolderContents = async (
  folderId: string | null,
  sort: string = "created_at-desc",
) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    let currentFolder: { id: string; name: string; path: string; depth: number; is_trashed: boolean } | null = null;
    if (folderId) {
      const { data, error } = await supabase
        .from("folders")
        .select("id, name, path, depth, is_trashed, workspace_id")
        .eq("id", folderId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.workspace_id !== currentUser.workspaceId) {
        throw new Error("Folder not found in this workspace");
      }
      currentFolder = {
        id: data.id,
        name: data.name,
        path: data.path || data.id,
        depth: data.depth,
        is_trashed: data.is_trashed,
      };
    }

    const breadcrumbIds = currentFolder?.path?.split("/") || [];
    const { data: breadcrumbRows, error: breadcrumbError } = breadcrumbIds.length
      ? await supabase
          .from("folders")
          .select("id, name, depth")
          .eq("workspace_id", currentUser.workspaceId)
          .in("id", breadcrumbIds)
          .order("depth", { ascending: true })
      : { data: [], error: null };
    if (breadcrumbError) throw breadcrumbError;

    let foldersQuery = supabase
      .from("folders")
      .select(FOLDER_SELECT)
      .eq("workspace_id", currentUser.workspaceId);
    foldersQuery = folderId
      ? foldersQuery.eq("parent_folder_id", folderId)
      : foldersQuery.is("parent_folder_id", null);
    const { data: subfolderRows, error: subfolderError } = await foldersQuery;
    if (subfolderError) throw subfolderError;

    let filesQuery = supabase
      .from("files")
      .select(FILE_SELECT)
      .eq("workspace_id", currentUser.workspaceId);
    filesQuery = folderId
      ? filesQuery.eq("folder_id", folderId)
      : filesQuery.is("folder_id", null);
    const { data: fileRows, error: fileError } = await filesQuery;
    if (fileError) throw fileError;

    const files = fileRows || [];
    const { data: signedUrls } = files.length
      ? await supabase
          .storage.from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
          .createSignedUrls(files.map((file) => file.storage_key), 3600)
      : { data: [] };
    const signedUrlMap = new Map<string, string>();
    (signedUrls || []).forEach((entry) => {
      if (entry.path && entry.signedUrl) signedUrlMap.set(entry.path, entry.signedUrl);
    });

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("workspace_id", currentUser.workspaceId)
      .maybeSingle();

    const userCanUpload = membership?.role
      ? canUpload(membership.role as WorkspaceRole)
      : false;

    const mappedSubfolders = await mapFoldersWithCounts(
      supabase,
      currentUser.workspaceId,
      (subfolderRows || []) as FolderRowWithOwner[],
    );

    const mappedFiles = files.map((file) =>
      mapRowToFileItem(
        file as Parameters<typeof mapRowToFileItem>[0],
        [],
        signedUrlMap.get(file.storage_key) || "",
      ),
    );

    return parseStringify({
      currentFolder: currentFolder
        ? {
            id: currentFolder.id,
            name: currentFolder.name,
            isTrashed: currentFolder.is_trashed,
          }
        : null,
      breadcrumbs: (breadcrumbRows || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
      })),
      subfolders: sortItems(mappedSubfolders, sort),
      files: sortItems(mappedFiles, sort),
      canUpload: userCanUpload,
    });
  } catch (error) {
    handleError(error, "Failed to get folder contents");
  }
};

export const getFoldersForPicker = async (excludeFolderId?: string) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");
    const { data, error } = await supabase
      .from("folders")
      .select(FOLDER_SELECT)
      .eq("workspace_id", currentUser.workspaceId)
      .eq("is_trashed", false)
      .order("path", { ascending: true });
    if (error) throw error;

    const excluded = excludeFolderId
      ? (data || []).find((folder: any) => folder.id === excludeFolderId)
      : undefined;
    const folders = (data || []).filter(
      (folder: any) =>
        !excluded ||
        (folder.id !== excluded.id &&
          !(excluded.path && folder.path?.startsWith(`${excluded.path}/`))),
    );
    return parseStringify(folders.map((folder: any) => mapFolderRow(folder as FolderRowWithOwner)));
  } catch (error) {
    handleError(error, "Failed to get folders for picker");
  }
};

export const getTrashedFolders = async () => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const { data, error } = await supabase
      .from("folders")
      .select(FOLDER_SELECT)
      .eq("workspace_id", currentUser.workspaceId)
      .eq("is_trashed", true)
      .order("trashed_at", { ascending: false });
    if (error) throw error;

    return parseStringify({
      folders: await mapFoldersWithCounts(
        supabase,
        currentUser.workspaceId,
        (data || []) as FolderRowWithOwner[],
      ),
    });
  } catch (error) {
    handleError(error, "Failed to get trashed folders");
  }
};
