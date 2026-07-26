import FolderBrowser from "@/components/folders/FolderBrowser";
import { getFolderContents } from "@/lib/actions/folder.actions";

export default async function FilesPage() {
  const contents = await getFolderContents(null);
  return <FolderBrowser {...contents} />;
}
