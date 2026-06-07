"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser } from "./user.actions";
import { canUpload, canDeleteOthers, type WorkspaceRole } from "@/lib/permissions";
import { MAX_FILE_SIZE } from "@/constants";

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

/**
 * Generates a 1-hour signed URL for direct download/preview.
 * The URL is generated server-side and handed to the client — it is NOT cached
 * across requests because short TTL is intentional for security.
 */
const createSignedDownloadUrl = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  storageKey: string,
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
    .createSignedUrl(storageKey, 3600); // 1 hour
  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
};

const mapRowToFileItem = (
  row: FileRowWithOwner,
  sharedWith: string[],
  signedUrl: string = "",
): FileItem => {
  const extension = row.extension || getFileType(row.name).extension;
  const isImage = row.type === "image";

  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    extension,
    type: row.type as FileType,
    size: row.size,
    url: signedUrl,
    // Stable, auth-protected route → sharp resizes to 200×200 WebP 60%q
    // browser caches for 24 h; works without any Supabase premium features
    thumbnailUrl: isImage ? `/api/thumbnail/${row.id}` : "",
    downloadUrl: signedUrl,
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

const fetchWorkspaceFiles = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceId: string,
  types: FileType[],
  searchText: string,
) => {
  const baseQuery = supabase.from("files").select(FILE_SELECT);
  const filteredQuery = applyFilters(baseQuery, types, searchText).eq(
    "workspace_id",
    workspaceId,
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
      throw new Error("You do not have permission to upload files in this workspace");
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
          console.error("Failed to remove storage blob after insert failure:", removeError);
        }
      } catch (err) {
        console.error("Failed to remove storage blob after insert failure:", err);
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

    const workspaceFiles = await fetchWorkspaceFiles(
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

    const combinedMap = new Map<string, FileRowWithOwner>();
    [...workspaceFiles, ...sharedFiles].forEach((file) => {
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
      if (entry.signedUrl && entry.path) signedUrlMap.set(entry.path, entry.signedUrl);
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
      .select("owner_id, storage_key, workspace_id")
      .eq("id", fileId)
      .single();

    if (fetchError) throw fetchError;

    // If caller is not the file owner, check if they have admin/owner role
    if (fileRecord.owner_id !== currentUser.id) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("workspace_id", fileRecord.workspace_id)
        .maybeSingle();

      if (
        !membership?.role ||
        !canDeleteOthers(membership.role as WorkspaceRole)
      ) {
        throw new Error("Not authorized to delete this file.");
      }
    }

    const { error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (deleteError) throw deleteError;

    if (fileRecord.storage_key) {
      const { error: storageDeleteError } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
        .remove([fileRecord.storage_key]);
      if (storageDeleteError) throw storageDeleteError;
    }

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
