import { getFileType } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import type { createSupabaseAdmin } from "@/lib/supabase/admin";

type FileRow = Database["public"]["Tables"]["files"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AiMetaJoin = {
  tags: string[] | null;
  processing_status: AiProcessingStatus;
} | null;

export type FileRowWithOwner = FileRow & {
  owner: Pick<UserRow, "id" | "full_name" | "email" | "avatar_url"> | null;
  ai_metadata: AiMetaJoin;
};

export const FILE_SELECT =
  "id, name, original_name, extension, mime_type, type, size, storage_key, thumbnail_key, preview_status, owner_id, workspace_id, is_trashed, trashed_at, created_at, updated_at, owner:users!files_owner_id_fkey(id, full_name, email, avatar_url), ai_metadata(tags, processing_status)";

export const createSignedDownloadUrl = async (
  supabase: ReturnType<typeof createSupabaseAdmin>,
  storageKey: string,
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!)
    .createSignedUrl(storageKey, 3600);
  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
};

export const mapRowToFileItem = (
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
    thumbnailUrl: isImage ? `/api/thumbnail/${row.id}` : "",
    downloadUrl: signedUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storageKey: row.storage_key,
    isTrashed: row.is_trashed,
    trashedAt: row.trashed_at,
    owner: {
      id: row.owner?.id || row.owner_id || "",
      fullName: row.owner?.full_name || "Unknown",
      email: row.owner?.email || "",
      avatarUrl: row.owner?.avatar_url || null,
    },
    sharedWith,
    tags: (row.ai_metadata as AiMetaJoin)?.tags ?? null,
    aiStatus: (row.ai_metadata as AiMetaJoin)?.processing_status ?? undefined,
  };
};
