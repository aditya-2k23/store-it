"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser } from "./user.actions";
import {
  canUpload,
  canModifyOthersFiles,
  canDeleteOthers,
  type WorkspaceRole,
} from "@/lib/permissions";
import { MAX_FILE_SIZE } from "@/constants";
import { logActivity } from "./activity.actions";
import {
  FILE_SELECT,
  createSignedDownloadUrl,
  mapRowToFileItem,
  type FileRowWithOwner,
} from "@/lib/file-item.helpers";

import type { Database } from "@/types/database.types";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

const TOTAL_SPACE_CACHE_TAG = "total-space-used";

type FileRow = Database["public"]["Tables"]["files"]["Row"];

const applyFilters = (query: any, types: FileType[], searchText: string) => {
  let filteredQuery = query.eq("is_trashed", false);

  if (types.length > 0) {
    filteredQuery = filteredQuery.in("type", types);
  }

  if (searchText) {
    const like = `%${searchText}%`;
    filteredQuery = filteredQuery.or(
      `name.ilike.${like},original_name.ilike.${like}`,
    );
  }

  return filteredQuery;
};

const fetchWorkspaceFiles = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceId: string,
  types: FileType[],
  searchText: string,
) => {
  const filesQuery = applyFilters(
    supabase.from("files").select(FILE_SELECT),
    types,
    searchText,
  )
    .eq("workspace_id", workspaceId);

  const { data, error } = await filesQuery;
  if (error) throw error;

  return {
    files: (data || []) as FileRowWithOwner[],
  };
};

export const fetchSharedFileIds = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  email: string,
) => {
  const { data, error } = await supabase
    .from("direct_file_shares")
    .select("file_id")
    .eq("shared_with_email", email);

  if (error) throw error;

  return (data || []).map((row) => row.file_id);
};

const fetchFilesByIds = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  fileIds: string[],
  types: FileType[],
  searchText: string,
  workspaceId: string,
) => {
  if (fileIds.length === 0) return [] as FileRowWithOwner[];

  const baseQuery = supabase
    .from("files")
    .select(FILE_SELECT)
    .in("id", fileIds)
    .eq("workspace_id", workspaceId);
  const filteredQuery = applyFilters(baseQuery, types, searchText);

  const { data, error } = await filteredQuery;
  if (error) throw error;

  return (data || []) as FileRowWithOwner[];
};

const fetchTagMatchedWorkspaceFiles = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  types: FileType[],
  searchText: string,
  workspaceId: string,
) => {
  if (!searchText) {
    return [] as FileRowWithOwner[];
  }

  // Filter tag matches in the database using ilike on the STORED generated column
  // tags_search (= array_to_string(tags, ' ')). This replaces the former pattern of
  // fetching all ai_metadata rows unbounded and filtering in JS — that approach
  // silently returned incomplete results for workspaces with >db.max_rows ai_metadata
  // rows because PostgREST's row cap applied before the JS filter ran.
  //
  // ilike is case-insensitive, matching the previous .toLowerCase().includes() behavior.
  // The .limit(100) cap is now enforced by the database, not by post-fetch .slice().
  let query = supabase
    .from("ai_metadata")
    .select("file_id, files!inner(workspace_id, type, is_trashed)")
    .eq("files.workspace_id", workspaceId)
    .eq("files.is_trashed", false)
    .ilike("tags_search", `%${searchText}%`)
    .limit(100);

  if (types.length > 0) {
    query = query.in("files.type", types);
  }

  const { data, error } = await query;
  if (error) throw error;

  const matchingFileIds = (data || []).map((metadata) => metadata.file_id);

  return fetchFilesByIds(supabase, matchingFileIds, types, "", workspaceId);
};

const fetchShareMap = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  fileIds: string[],
) => {
  if (fileIds.length === 0) return new Map<string, string[]>();

  const { data, error } = await supabase
    .from("direct_file_shares")
    .select("file_id, shared_with_email")
    .in("file_id", fileIds);

  if (error) throw error;

  const map = new Map<string, string[]>();
  (data || []).forEach((row) => {
    const existing = map.get(row.file_id) || [];
    if (!existing.includes(row.shared_with_email)) {
      existing.push(row.shared_with_email);
    }
    map.set(row.file_id, existing);
  });

  return map;
};

const sortFiles = (files: FileRowWithOwner[], sort: string) => {
  const [rawSortBy, rawOrderBy] = sort.split("-");
  const sortBy = rawSortBy === "$createdAt" ? "created_at" : rawSortBy;
  const orderBy = rawOrderBy === "asc" ? "asc" : "desc";
  const multiplier = orderBy === "asc" ? 1 : -1;

  return [...files].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name) * multiplier;
      case "size":
        return (a.size - b.size) * multiplier;
      case "created_at":
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          multiplier
        );
      default:
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          multiplier
        );
    }
  });
};

export const uploadFile = async ({ file, path }: UploadFileProps) => {
  const supabase = createSupabaseAdmin();

  try {
    if (file.size > MAX_FILE_SIZE) {
      throw new RangeError("File size exceeds the 50MB limit");
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Permission check: verify the user can upload in this workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("workspace_id", currentUser.workspaceId)
      .maybeSingle();

    if (!membership?.role || !canUpload(membership.role as WorkspaceRole)) {
      throw new Error(
        "You do not have permission to upload files in this workspace",
      );
    }

    const { type, extension } = getFileType(file.name);
    const fileId = crypto.randomUUID();
    const storageKey = `${currentUser.workspaceId}/${fileId}-${file.name}`;
    // Upload file to Supabase storage bucket
    const { error: storageError } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
      .upload(storageKey, file);
    if (storageError) throw storageError;

    const { data: insertedFile, error: insertError } = await supabase
      .from("files")
      .insert({
        id: fileId,
        name: file.name,
        original_name: file.name,
        extension,
        mime_type: file.type || null,
        type,
        size: file.size,
        storage_key: storageKey,
        workspace_id: currentUser.workspaceId,
        owner_id: currentUser.id,
      })
      .select(FILE_SELECT)
      .single();

    if (insertError) {
      try {
        const { error: removeError } = await supabase.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
          .remove([storageKey]);
        if (removeError) {
          console.error(
            "Failed to remove storage blob after insert failure:",
            removeError,
          );
        }
      } catch (err) {
        console.error(
          "Failed to remove storage blob after insert failure:",
          err,
        );
      }
      throw insertError;
    }

    const signedUrl = await createSignedDownloadUrl(supabase, storageKey);
    const fileItem = mapRowToFileItem(
      insertedFile as FileRowWithOwner,
      [],
      signedUrl,
    );

    revalidatePath(path);
    revalidateTag(TOTAL_SPACE_CACHE_TAG, { expire: 0 });

    await logActivity({
      userId: currentUser.id,
      workspaceId: currentUser.workspaceId,
      fileId: fileId,
      action: "file.upload",
      metadata: {
        fileName: file.name,
        fileId,
        size: file.size,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });

    return parseStringify(fileItem);
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "created_at-desc",
  limit,
  offset,
}: GetFilesProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const { files: workspaceFiles } = await fetchWorkspaceFiles(
      supabase,
      currentUser.workspaceId,
      types,
      searchText,
    );

    const sharedFileIds = await fetchSharedFileIds(
      supabase,
      currentUser.email.toLowerCase(),
    );

    const sharedFiles = await fetchFilesByIds(
      supabase,
      sharedFileIds,
      types,
      searchText,
      currentUser.workspaceId,
    );

    let tagMatchedWorkspaceFiles: FileRowWithOwner[] = [];
    if (searchText) {
      tagMatchedWorkspaceFiles = await fetchTagMatchedWorkspaceFiles(
        supabase,
        types,
        searchText,
        currentUser.workspaceId,
      );
    }

    const combinedMap = new Map<string, FileRowWithOwner>();
    [...workspaceFiles, ...sharedFiles, ...tagMatchedWorkspaceFiles].forEach(
      (file) => {
        combinedMap.set(file.id, file);
      },
    );

    const combinedFiles = Array.from(combinedMap.values());
    const total = combinedMap.size;

    const sortedFiles = sortFiles(combinedFiles, sort);
    const start = offset || 0;
    const end = limit ? start + limit : sortedFiles.length;
    const pagedFiles = sortedFiles.slice(start, end);

    const shareMap = await fetchShareMap(
      supabase,
      pagedFiles.map((file) => file.id),
    );

    // Batch-generate signed URLs for all paged files in a single Supabase call
    const { data: signedUrls } = pagedFiles.length
      ? await supabase.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
          .createSignedUrls(
            pagedFiles.map((f) => f.storage_key),
            3600,
          )
      : { data: [] };

    const signedUrlMap = new Map<string, string>();
    (signedUrls || []).forEach((entry) => {
      if (entry.signedUrl && entry.path)
        signedUrlMap.set(entry.path, entry.signedUrl);
    });

    const documents = pagedFiles.map((file) =>
      mapRowToFileItem(
        file,
        shareMap.get(file.id) || [],
        signedUrlMap.get(file.storage_key) || "",
      ),
    );

    return parseStringify({ documents, total });
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const getFileAccessUrl = async (
  fileId: string,
): Promise<string | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const supabase = createSupabaseAdmin();
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("owner_id, workspace_id, storage_key, is_trashed")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError || !file || file.is_trashed) return null;

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("workspace_id", file.workspace_id)
      .maybeSingle();

    if (membershipError) return null;

    if (!membership) {
      const { data: share, error: shareError } = await supabase
        .from("direct_file_shares")
        .select("id")
        .eq("file_id", fileId)
        .eq("shared_with_email", currentUser.email.toLowerCase())
        .maybeSingle();

      if (shareError || !share) return null;
    }

    const signedUrl = await createSignedDownloadUrl(supabase, file.storage_key);
    return signedUrl || null;
  } catch (error) {
    console.error("Failed to get file access URL:", error);
    return null;
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const newName = `${name}.${extension}`;

    const fileRecord = await getFileActionRecord(supabase, fileId);
    if (fileRecord.is_trashed) {
      throw new Error("Cannot rename a trashed file.");
    }
    await assertCanActOnFile(supabase, currentUser, fileRecord, "modify");

    const { error: updateError } = await supabase
      .from("files")
      .update({ name: newName, extension })
      .eq("id", fileId);

    if (updateError) throw updateError;

    revalidatePath(path);

    await logActivity({
      userId: currentUser.id,
      workspaceId: fileRecord.workspace_id,
      fileId,
      action: "file.rename",
      metadata: {
        oldName: fileRecord.name,
        newName,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const fileRecord = await getFileActionRecord(supabase, fileId);
    if (fileRecord.is_trashed) {
      throw new Error("Cannot update shares for a trashed file.");
    }
    await assertCanActOnFile(supabase, currentUser, fileRecord, "modify");

    const normalizedEmails = Array.from(
      new Set(
        emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
      ),
    );

    // Fetch existing shares before delete for diff-based logging
    const { data: existingShareRows, error: existingShareError } =
      await supabase
        .from("direct_file_shares")
        .select("shared_with_email")
        .eq("file_id", fileId);

    if (existingShareError) {
      console.error(
        "Failed to fetch existing shares for audit logging:",
        existingShareError,
      );
    }
    const existingEmails = existingShareError
      ? null
      : (existingShareRows || []).map((row) => row.shared_with_email);

    const { error: deleteError } = await supabase
      .from("direct_file_shares")
      .delete()
      .eq("file_id", fileId);

    if (deleteError) throw deleteError;

    if (normalizedEmails.length > 0) {
      const { error: insertError } = await supabase
        .from("direct_file_shares")
        .insert(
          normalizedEmails.map((email) => ({
            file_id: fileId,
            shared_by: currentUser.id,
            shared_with_email: email,
            permission: "view",
          })),
        );

      if (insertError) throw insertError;
    }

    revalidatePath(path);

    // Compute diff and log per-email changes
    if (existingEmails !== null) {
      const addedEmails = normalizedEmails.filter(
        (email) => !existingEmails.includes(email),
      );
      const removedEmails = existingEmails.filter(
        (email) => !normalizedEmails.includes(email),
      );

      for (const email of addedEmails) {
        await logActivity({
          userId: currentUser.id,
          workspaceId: fileRecord.workspace_id,
          fileId,
          action: "file.share.create",
          metadata: {
            fileName: fileRecord.name,
            email,
            actorName: currentUser.fullName,
            actorEmail: currentUser.email,
          },
        });
      }

      for (const email of removedEmails) {
        await logActivity({
          userId: currentUser.id,
          workspaceId: fileRecord.workspace_id,
          fileId,
          action: "file.share.remove",
          metadata: {
            fileName: fileRecord.name,
            email,
            actorName: currentUser.fullName,
            actorEmail: currentUser.email,
          },
        });
      }
    }

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to update file shares");
  }
};

type FileActionRecord = Pick<
  FileRow,
  "id" | "owner_id" | "name" | "storage_key" | "workspace_id" | "is_trashed"
>;

const getFileActionRecord = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  fileId: string,
) => {
  const { data, error } = await supabase
    .from("files")
    .select("id, owner_id, name, storage_key, workspace_id, is_trashed")
    .eq("id", fileId)
    .single();

  if (error) throw error;
  return data as FileActionRecord;
};

type FileCapability = "modify" | "delete";

const assertCanActOnFile = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  currentUser: CurrentUser,
  fileRecord: FileActionRecord,
  capability: FileCapability = "delete",
) => {
  if (fileRecord.owner_id === currentUser.id) return;

  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", currentUser.id)
    .eq("workspace_id", fileRecord.workspace_id)
    .maybeSingle();

  if (error) throw error;
  const role = membership?.role as WorkspaceRole | undefined;
  if (!role) {
    throw new Error("Not authorized to act on this file.");
  }

  const isAllowed =
    capability === "modify"
      ? canModifyOthersFiles(role)
      : canDeleteOthers(role);

  if (!isAllowed) {
    throw new Error("Not authorized to act on this file.");
  }
};

const hardDeleteFile = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  fileRecord: FileActionRecord,
  path: string,
  revalidate = true,
) => {
  // Remove storage object first; if this fails, the DB row remains available for retry.
  const { error: storageDeleteError } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
    .remove([fileRecord.storage_key]);
  if (storageDeleteError) throw storageDeleteError;

  // Preserve activity history while removing the foreign-key reference.
  const { error: unlinkLogsError } = await supabase
    .from("activity_logs")
    .update({ file_id: null })
    .eq("file_id", fileRecord.id);
  if (unlinkLogsError) throw unlinkLogsError;

  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileRecord.id);
  if (deleteError) throw deleteError;

  if (revalidate) {
    revalidatePath(path);
    revalidateTag(TOTAL_SPACE_CACHE_TAG, { expire: 0 });
  }
};

export const trashFile = async ({ fileId, path }: DeleteFileProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const fileRecord = await getFileActionRecord(supabase, fileId);
    await assertCanActOnFile(supabase, currentUser, fileRecord);
    if (fileRecord.is_trashed) throw new Error("File is already in trash");

    const { error } = await supabase
      .from("files")
      .update({ is_trashed: true, trashed_at: new Date().toISOString() })
      .eq("id", fileId);
    if (error) throw error;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: fileRecord.workspace_id,
      fileId,
      action: "file.trash",
      metadata: {
        fileName: fileRecord.name,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to move file to trash");
  }
};

export const restoreFile = async ({ fileId, path }: DeleteFileProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const fileRecord = await getFileActionRecord(supabase, fileId);
    await assertCanActOnFile(supabase, currentUser, fileRecord);
    if (!fileRecord.is_trashed) throw new Error("File is not in trash");

    const { error } = await supabase
      .from("files")
      .update({ is_trashed: false, trashed_at: null })
      .eq("id", fileId);
    if (error) throw error;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: fileRecord.workspace_id,
      fileId,
      action: "file.restore",
      metadata: {
        fileName: fileRecord.name,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to restore file");
  }
};

export const permanentlyDeleteFile = async ({
  fileId,
  path,
}: DeleteFileProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const fileRecord = await getFileActionRecord(supabase, fileId);
    await assertCanActOnFile(supabase, currentUser, fileRecord);
    if (!fileRecord.is_trashed) {
      throw new Error("Move to trash before permanently deleting");
    }

    await hardDeleteFile(supabase, fileRecord, path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: fileRecord.workspace_id,
      action: "file.delete",
      metadata: {
        fileName: fileRecord.name,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to permanently delete file");
  }
};

export const emptyTrash = async (workspaceId: string, path: string) => {
  const supabase = createSupabaseAdmin();
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User not found");

  const { data, error } = await supabase
    .from("files")
    .select("id, owner_id, name, storage_key, workspace_id, is_trashed")
    .eq("workspace_id", workspaceId)
    .eq("is_trashed", true);
  if (error) throw error;

  let deletedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  for (const fileRecord of (data || []) as FileActionRecord[]) {
    try {
      await assertCanActOnFile(supabase, currentUser, fileRecord);
    } catch {
      skippedCount += 1;
      continue;
    }

    try {
      await hardDeleteFile(supabase, fileRecord, path, false);
    } catch (err) {
      console.error(
        `Failed to delete trashed file (${fileRecord.id}):`,
        err,
      );
      failedCount += 1;
      continue;
    }

    deletedCount += 1;

    try {
      await logActivity({
        userId: currentUser.id,
        workspaceId: fileRecord.workspace_id,
        action: "file.delete",
        metadata: {
          fileName: fileRecord.name,
          actorName: currentUser.fullName,
          actorEmail: currentUser.email,
        },
      });
    } catch (logErr) {
      console.error(
        `Failed to log activity for deleted file (${fileRecord.id}):`,
        logErr,
      );
    }
  }

  revalidatePath(path);
  return parseStringify({ deletedCount, skippedCount, failedCount });
};

export const moveFileToFolder = async ({
  fileId,
  folderId,
  path,
}: {
  fileId: string;
  folderId: string | null;
  path: string;
}) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("workspace_id", currentUser.workspaceId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership?.role || !canUpload(membership.role as WorkspaceRole)) {
      throw new Error(
        "You do not have permission to move files in this workspace",
      );
    }

    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("workspace_id, name")
      .eq("id", fileId)
      .maybeSingle();
    if (fileError) throw fileError;
    if (!file || file.workspace_id !== currentUser.workspaceId) {
      throw new Error("File not found in this workspace");
    }

    let toFolderName = "Workspace Root";
    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .select("workspace_id, is_trashed, name")
        .eq("id", folderId)
        .maybeSingle();
      if (folderError) throw folderError;
      if (
        !folder ||
        folder.workspace_id !== currentUser.workspaceId ||
        folder.is_trashed
      ) {
        throw new Error("Target folder is unavailable");
      }
      toFolderName = folder.name;
    }

    const { error: updateError } = await supabase
      .from("files")
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .eq("id", fileId);
    if (updateError) throw updateError;

    revalidatePath(path);
    await logActivity({
      userId: currentUser.id,
      workspaceId: currentUser.workspaceId,
      fileId,
      action: "file.move",
      metadata: {
        fileName: file.name,
        toFolderName,
        actorName: currentUser.fullName,
        actorEmail: currentUser.email,
      },
    });

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to move file to folder");
  }
};

const purgeExpiredTrash = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceId: string,
) => {
  try {
    const expiration = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await supabase
      .from("files")
      .select("id, owner_id, name, storage_key, workspace_id, is_trashed")
      .eq("workspace_id", workspaceId)
      .eq("is_trashed", true)
      .lt("trashed_at", expiration)
      .limit(10);

    if (error || !data || data.length === 0) return;

    for (const fileRecord of data as FileActionRecord[]) {
      try {
        // Log first so the action is preserved; hardDeleteFile then unlinks its FK.
        await logActivity({
          userId: null,
          workspaceId: fileRecord.workspace_id,
          fileId: fileRecord.id,
          action: "file.delete",
          metadata: { fileName: fileRecord.name, reason: "auto_purge_30_days" },
        });
        await hardDeleteFile(supabase, fileRecord, "/trash", false);
      } catch (itemError) {
        console.error(
          `Failed to auto-purge expired file (${fileRecord.id}):`,
          itemError,
        );
      }
    }
  } catch (purgeError) {
    console.error("Error during expired trash purge:", purgeError);
  }
};

export const getTrashedFiles = async () => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    try {
      await purgeExpiredTrash(supabase, currentUser.workspaceId);
    } catch (purgeErr) {
      console.error("Expired trash purge failed:", purgeErr);
    }

    const { data, error } = await supabase
      .from("files")
      .select(FILE_SELECT)
      .eq("workspace_id", currentUser.workspaceId)
      .eq("is_trashed", true)
      .order("trashed_at", { ascending: false });
    if (error) throw error;

    const files = (data || []) as FileRowWithOwner[];
    const { data: signedUrls } = files.length
      ? await supabase.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
          .createSignedUrls(
            files.map((file) => file.storage_key),
            3600,
          )
      : { data: [] };

    const signedUrlMap = new Map<string, string>();
    (signedUrls || []).forEach((entry) => {
      if (entry.path && entry.signedUrl) {
        signedUrlMap.set(entry.path, entry.signedUrl);
      }
    });

    const documents = files.map((file) => {
      const elapsedDays = Math.floor(
        (Date.now() - new Date(file.trashed_at || Date.now()).getTime()) /
          (24 * 60 * 60 * 1000),
      );
      return {
        ...mapRowToFileItem(file, [], signedUrlMap.get(file.storage_key) || ""),
        daysUntilPurge: Math.max(0, 30 - elapsedDays),
      };
    });

    return parseStringify({ documents });
  } catch (error) {
    handleError(error, "Failed to get trashed files");
  }
};

export async function getTotalSpaceUsed() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const totalSpace = await getCachedTotalSpaceUsed(currentUser.workspaceId);

    return parseStringify(totalSpace);
  } catch (error) {
    handleError(error, "Error calculating total space used");
  }
}

const computeTotalSpaceUsed = async (workspaceId: string) => {
  const supabase = createSupabaseAdmin();

  const { data: files, error } = await supabase
    .from("files")
    .select("type, size, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("is_trashed", false);

  if (error) throw error;

  const totalSpace = {
    image: { size: 0, latestDate: "" },
    document: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
    used: 0,
    all: 2 * 1024 * 1024 * 1024,
  };

  (files || []).forEach((file) => {
    const fileType = (file.type as FileType) || "other";
    if (!totalSpace[fileType]) return;

    const size = typeof file.size === "number" ? file.size : 0;
    totalSpace[fileType].size += size;
    totalSpace.used += size;

    if (
      !totalSpace[fileType].latestDate ||
      new Date(file.updated_at) > new Date(totalSpace[fileType].latestDate)
    ) {
      totalSpace[fileType].latestDate = file.updated_at;
    }
  });

  return totalSpace;
};

const getCachedTotalSpaceUsed = unstable_cache(
  async (workspaceId: string) => computeTotalSpaceUsed(workspaceId),
  [TOTAL_SPACE_CACHE_TAG],
  { revalidate: 300, tags: [TOTAL_SPACE_CACHE_TAG] },
);

export async function getStorageSnapshot() {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const workspaceId = currentUser.workspaceId;
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Get all non-trashed files for the workspace
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, type, created_at")
      .eq("workspace_id", workspaceId)
      .eq("is_trashed", false);

    if (filesError) throw filesError;

    const allFiles = files || [];
    const totalFiles = allFiles.length;

    // Files uploaded in the last 7 days
    const recentFiles = allFiles.filter(
      (f) => new Date(f.created_at) >= new Date(oneWeekAgo),
    );
    const uploadedLastWeek = recentFiles.length;

    // Dominant type — use this week's files if ≥ 3, otherwise use all
    const filesForType = recentFiles.length >= 3 ? recentFiles : allFiles;
    const typeCounts: Record<string, number> = {};
    filesForType.forEach((f) => {
      typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
    });
    const dominantType =
      Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "document";

    // AI processed count
    const { count: aiProcessedCount } = await supabase
      .from("ai_metadata")
      .select("id", { count: "exact", head: true })
      .eq("processing_status", "completed")
      .in(
        "file_id",
        allFiles.map((f) => f.id),
      );

    return parseStringify({
      uploadedLastWeek,
      dominantType,
      totalFiles,
      aiProcessedCount: aiProcessedCount || 0,
    });
  } catch (error) {
    handleError(error, "Failed to get storage snapshot");
  }
}

export async function getPaginatedProcessedFiles({
  workspaceId,
  offset = 0,
  limit = 5,
}: {
  workspaceId: string;
  offset?: number;
  limit?: number;
}) {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Verify caller is a member of the target workspace
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!membership) throw new Error("Not authorized to access this workspace");

    const { data, error, count } = await supabase
      .from("ai_metadata")
      .select(
        "file_id, processing_status, summary, tags, processed_at, file:files!inner(name, workspace_id, is_trashed)",
        { count: "exact" },
      )
      .eq("processing_status", "completed")
      .eq("file.workspace_id", workspaceId)
      .eq("file.is_trashed", false)
      .order("processed_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const items = data || [];
    const total = count || 0;
    const hasMore = offset + items.length < total;

    return parseStringify({ items, hasMore, total });
  } catch (error) {
    handleError(error, "Failed to get paginated processed files");
    return parseStringify({ items: [], hasMore: false, total: 0 });
  }
}
