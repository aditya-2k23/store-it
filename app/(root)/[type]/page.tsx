import Card from "@/components/Card";
import Sort from "@/components/Sort";
import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import {
  convertFileSize,
  getFileTypesParams,
  getUsageSummary,
} from "@/lib/utils";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as string) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";
  const pageParam = ((await searchParams)?.page as string) || "1";
  const page = Math.max(Number.parseInt(pageParam, 10) || 1, 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const types = getFileTypesParams(type) as FileType[];

  const [files, totalSpace] = await Promise.all([
    getFiles({
      types: types,
      searchText,
      sort,
      limit: pageSize,
      offset,
    }),
    getTotalSpaceUsed(),
  ]);

  const usageSummary = getUsageSummary(totalSpace);
  const currentUsage = usageSummary.find(
    (item) => item.title.toLowerCase() === type.toLowerCase(),
  );

  const totalPages = Math.max(Math.ceil(files.total / pageSize), 1);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();

    if (searchText) params.set("query", searchText);
    if (sort) params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));

    const queryString = params.toString();
    return queryString ? `/${type}?${queryString}` : `/${type}`;
  };

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total:{" "}
            <span className="h5">
              {currentUsage ? `${convertFileSize(currentUsage.size)}` : "0 KB"}
            </span>
          </p>

          <div className="sort-container">
            <p className="body-1 hidden sm:block text-light-200">Sort by:</p>

            <Sort />
          </div>
        </div>
      </section>

      {files.total > 0 ? (
        <section className="file-list">
          {files.documents.map((file: FileItem) => (
            <Card key={file.id} file={file} />
          ))}
        </section>
      ) : (
        <EmptyState type={type} />
      )}
      {totalPages > 1 && (
        <div className="flex w-full items-center justify-between">
          <Link
            href={buildPageHref(page - 1)}
            className={`inline-flex items-center justify-center rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 ${
              hasPrevPage ? "" : "pointer-events-none opacity-40"
            }`}
          >
            Previous
          </Link>

          <p className="caption text-light-200">
            Page {page} of {totalPages}
          </p>

          <Link
            href={buildPageHref(page + 1)}
            className={`inline-flex items-center justify-center rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 ${
              hasNextPage ? "" : "pointer-events-none opacity-40"
            }`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
};

export default Page;
