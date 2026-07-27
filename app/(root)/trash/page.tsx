import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { getTrashedFiles } from "@/lib/actions/file.actions";
import FolderCard from "@/components/folders/FolderCard";
import { getTrashedFolders } from "@/lib/actions/folder.actions";

const TrashPage = async () => {
  const [files, folders] = await Promise.all([
    getTrashedFiles(),
    getTrashedFolders(),
  ]);
  const hasTrashedItems =
    (files?.documents.length || 0) > 0 || (folders?.folders.length || 0) > 0;

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Trash</h1>
        <p className="body-1 mt-2 text-light-200">
          Files are permanently deleted 30 days after being moved here.
        </p>
      </section>

      {hasTrashedItems ? (
        <section className="file-list">
          {(folders?.folders || []).map((folder: FolderItem) => (
            <FolderCard key={folder.id} folder={folder} allowTrashedNavigation />
          ))}
          {files.documents.map((file: FileItem) => (
            <Card key={file.id} file={file} />
          ))}
        </section>
      ) : (
        <EmptyState type="trash" />
      )}
    </div>
  );
};

export default TrashPage;
