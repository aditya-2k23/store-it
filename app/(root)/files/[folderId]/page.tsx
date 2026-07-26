import FolderBrowser from "@/components/folders/FolderBrowser";
import { getFolderContents } from "@/lib/actions/folder.actions";

export default async function FolderPage({ params, searchParams }: SearchParamProps) {
  const folderId = (await params)?.folderId as string;
  const sort = ((await searchParams)?.sort as string) || "created_at-desc";
  const contents = await getFolderContents(folderId, sort);
  return <FolderBrowser {...contents} />;
}
