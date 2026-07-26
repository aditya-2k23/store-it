import FolderBrowser from "@/components/folders/FolderBrowser";
import { getFolderContents } from "@/lib/actions/folder.actions";

export default async function FolderPage({ params }: SearchParamProps) {
  const folderId = (await params)?.folderId as string;
  const contents = await getFolderContents(folderId);
  return <FolderBrowser {...contents} />;
}
