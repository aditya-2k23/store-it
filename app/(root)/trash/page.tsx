import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { getTrashedFiles } from "@/lib/actions/file.actions";

const TrashPage = async () => {
  const files = await getTrashedFiles();

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Trash</h1>
        <p className="body-1 mt-2 text-light-200">
          Files are permanently deleted 30 days after being moved here.
        </p>
      </section>

      {files.documents.length > 0 ? (
        <section className="file-list">
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
