import FolderBrowser from "@/components/folders/FolderBrowser";
import { getFolderContents } from "@/lib/actions/folder.actions";
import { sortTypes } from "@/constants";

export default async function FolderPage({ params, searchParams }: SearchParamProps) {
  const folderId = (await params)?.folderId as string;
  const rawSort = (await searchParams)?.sort;
  const sortValue = Array.isArray(rawSort) ? rawSort[0] : (rawSort as string);
  const sort = sortTypes.some((t) => t.value === sortValue) ? sortValue : "created_at-desc";
  const contents = await getFolderContents(folderId, sort);
  return <FolderBrowser {...contents} />;
}
