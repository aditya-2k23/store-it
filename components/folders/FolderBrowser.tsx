"use client";

import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import CreateFolderDialog from "./CreateFolderDialog";
import FolderCard from "./FolderCard";

type FolderBrowserProps = {
  currentFolder: { id: string; name: string; isTrashed: boolean } | null;
  breadcrumbs: FolderBreadcrumb[];
  subfolders: FolderItem[];
  files: FileItem[];
};

export default function FolderBrowser({
  currentFolder,
  breadcrumbs,
  subfolders,
  files,
}: FolderBrowserProps) {
  return (
    <div className="page-container">
      <section className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1 text-sm text-light-200">
              <Link href="/files" className="hover:text-brand">Files</Link>
              {breadcrumbs.map((crumb) => (
                <div key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="size-4" />
                  <Link href={`/files/${crumb.id}`} className="hover:text-brand">{crumb.name}</Link>
                </div>
              ))}
            </div>
            <h1 className="h1 mt-2">{currentFolder?.name || "Files"}</h1>
          </div>
          {!currentFolder?.isTrashed && (
            <CreateFolderDialog parentFolderId={currentFolder?.id || null} />
          )}
        </div>
      </section>

      {subfolders.length > 0 || files.length > 0 ? (
        <section className="file-list">
          {subfolders.map((folder) => <FolderCard key={folder.id} folder={folder} />)}
          {files.map((file) => <Card key={file.id} file={file} />)}
        </section>
      ) : (
        <div className="flex w-full flex-col items-center">
          <Folder className="size-10 text-brand" />
          <EmptyState type="folders" showUpload={false} />
        </div>
      )}
    </div>
  );
}
