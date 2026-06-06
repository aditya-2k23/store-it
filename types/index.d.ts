declare type FileType = "document" | "image" | "video" | "audio" | "other";

declare interface ActionType {
  label: string;
  icon: string;
  value: string;
}

declare interface SearchParamProps {
  params?: Promise<SegmentParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

declare interface CurrentUser {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  username: string | null;
  plan: string;
  workspaceId: string;
}

declare interface FileOwner {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

declare interface FileItem {
  id: string;
  name: string;
  originalName: string;
  extension: string;
  type: FileType;
  size: number;
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
  storageKey: string;
  owner: FileOwner;
  sharedWith: string[];
}

declare interface UploadFileProps {
  file: File;
  path: string;
}

declare interface GetFilesProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

declare interface RenameFileProps {
  fileId: string;
  name: string;
  extension: string;
  path: string;
}

declare interface UpdateFileUsersProps {
  fileId: string;
  emails: string[];
  path: string;
}

declare interface DeleteFileProps {
  fileId: string;
  path: string;
}

declare interface FileUploaderProps {
  className?: string;
}

declare interface MobileNavigationProps {
  fullName: string;
  avatar: string;
  email: string;
}

declare interface ThumbnailProps {
  type: string;
  extension: string;
  url: string;
  className?: string;
  imageClassName?: string;
}

declare interface ShareInputProps {
  file: FileItem;
  onInputChange: (emails: string[]) => void;
  onRemove: (email: string) => void;
}

declare type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

declare interface WorkspaceWithRole {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  ownerId: string | null;
  storageLimit: number;
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
  role: WorkspaceRole;
  memberCount?: number;
}

declare interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

declare interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  invitedBy: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}
