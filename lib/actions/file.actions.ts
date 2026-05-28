"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser } from "./user.actions";
import type { Database } from "@/types/database.types";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

const TOTAL_SPACE_CACHE_TAG = "total-space-used";

type FileRow = Database["public"]["Tables"]["files"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type FileRowWithOwner = FileRow & {
  owner: Pick<UserRow, "id" | "full_name" | "email" | "avatar_url"> | null;
};

const FILE_SELECT =
  "id, name, original_name, extension, mime_type, type, size, storage_key, thumbnail_key, preview_status, owner_id, workspace_id, created_at, updated_at, owner:users!files_owner_id_fkey(id, full_name, email, avatar_url)";

const mapRowToFileItem = (
  row: FileRowWithOwner,
  sharedWith: string[],
): FileItem => {
  const extension = row.extension || getFileType(row.name).extension;

  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    extension,
    type: row.type as FileType,
    size: row.size,
    url: "",
    downloadUrl: "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storageKey: row.storage_key,
    owner: {
      id: row.owner?.id || row.owner_id || "",
      fullName: row.owner?.full_name || "Unknown",
      email: row.owner?.email || "",
      avatarUrl: row.owner?.avatar_url || null,
    },
    sharedWith,
  };
};

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

const fetchOwnerFiles = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  ownerId: string,
  types: FileType[],
  searchText: string,
) => {
  const baseQuery = supabase.from("files").select(FILE_SELECT);
  const filteredQuery = applyFilters(baseQuery, types, searchText).eq(
    "owner_id",
    ownerId,
  );

  const { data, error } = await filteredQuery;
  if (error) throw error;

  return (data || []) as FileRowWithOwner[];
};

const fetchSharedFileIds = async (
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
) => {
  if (fileIds.length === 0) return [] as FileRowWithOwner[];

  const baseQuery = supabase
    .from("files")
    .select(FILE_SELECT)
    .in("id", fileIds);
  const filteredQuery = applyFilters(baseQuery, types, searchText);

  const { data, error } = await filteredQuery;
  if (error) throw error;

  return (data || []) as FileRowWithOwner[];
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
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const { type, extension } = getFileType(file.name);
    const fileId = crypto.randomUUID();
    const storageKey = `${currentUser.workspaceId}/${fileId}-${file.name}`;

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

    if (insertError) throw insertError;

    const fileItem = mapRowToFileItem(insertedFile as FileRowWithOwner, []);

    revalidatePath(path);
    revalidateTag(TOTAL_SPACE_CACHE_TAG, { expire: 0 });

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

    const ownerFiles = await fetchOwnerFiles(
      supabase,
      currentUser.id,
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
    );

    const combinedMap = new Map<string, FileRowWithOwner>();
    [...ownerFiles, ...sharedFiles].forEach((file) => {
      combinedMap.set(file.id, file);
    });

    const combinedFiles = Array.from(combinedMap.values());
    const total = combinedFiles.length;

    const sortedFiles = sortFiles(combinedFiles, sort);
    const start = offset || 0;
    const end = limit ? start + limit : sortedFiles.length;
    const pagedFiles = sortedFiles.slice(start, end);

    const shareMap = await fetchShareMap(
      supabase,
      pagedFiles.map((file) => file.id),
    );

    const documents = pagedFiles.map((file) =>
      mapRowToFileItem(file, shareMap.get(file.id) || []),
    );

    return parseStringify({ documents, total });
  } catch (error) {
    handleError(error, "Failed to get files");
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

    const { data: fileRecord, error: fetchError } = await supabase
      .from("files")
      .select("owner_id")
      .eq("id", fileId)
      .single();

    if (fetchError) throw fetchError;
    if (fileRecord.owner_id !== currentUser.id) {
      throw new Error("Not authorized to rename this file.");
    }

    const { error: updateError } = await supabase
      .from("files")
      .update({ name: newName, extension })
      .eq("id", fileId);

    if (updateError) throw updateError;

    revalidatePath(path);

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

    const { data: fileRecord, error: fetchError } = await supabase
      .from("files")
      .select("owner_id")
      .eq("id", fileId)
      .single();

    if (fetchError) throw fetchError;
    if (fileRecord.owner_id !== currentUser.id) {
      throw new Error("Not authorized to share this file.");
    }

    const normalizedEmails = Array.from(
      new Set(
        emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
      ),
    );

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

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to update file shares");
  }
};

export const deleteFileUsers = async ({ fileId, path }: DeleteFileProps) => {
  const supabase = createSupabaseAdmin();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const { data: fileRecord, error: fetchError } = await supabase
      .from("files")
      .select("owner_id, storage_key")
      .eq("id", fileId)
      .single();

    if (fetchError) throw fetchError;
    if (fileRecord.owner_id !== currentUser.id) {
      throw new Error("Not authorized to delete this file.");
    }

    const { error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (deleteError) throw deleteError;

    revalidatePath(path);
    revalidateTag(TOTAL_SPACE_CACHE_TAG, { expire: 0 });

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to delete file");
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
