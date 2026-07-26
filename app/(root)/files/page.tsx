import FolderBrowser from "@/components/folders/FolderBrowser";
import { getFolderContents } from "@/lib/actions/folder.actions";

export default async function FilesPage({ searchParams }: SearchParamProps) {
  const sort = ((await searchParams)?.sort as string) || "created_at-desc";
  const contents = await getFolderContents(null, sort);
  return <FolderBrowser {...contents} />;
}
