"use client";

import { useState, useTransition } from "react";
import { getPaginatedProcessedFiles } from "@/lib/actions/file.actions";
import { Loader2 } from "lucide-react";

export interface AiFileRow {
  file_id: string;
  processing_status: string;
  summary: string | null;
  tags: string[] | null;
  processed_at: string | null;
  file: {
    name: string;
  } | null;
}

interface PrivacyTableProps {
  initialData: AiFileRow[];
  initialHasMore: boolean;
  workspaceId: string;
}

export default function PrivacyTable({
  initialData,
  initialHasMore,
  workspaceId,
}: PrivacyTableProps) {
  const [data, setData] = useState<AiFileRow[]>(initialData);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    startTransition(async () => {
      try {
        const res = await getPaginatedProcessedFiles({
          workspaceId,
          offset: data.length,
          limit: 5,
        });

        if (res?.items) {
          setData((prev) => [...prev, ...res.items]);
          setHasMore(res.hasMore);
        }
      } catch (err) {
        console.error("Failed to load more processed files:", err);
      }
    });
  };

  if (data.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-light-400">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-light-400 bg-light-400/30">
              <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                File
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                Tags
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                Summary
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-dark-100">
                Processed
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.file_id}
                className="border-b border-light-400 last:border-0"
              >
                <td className="px-4 py-2.5 text-light-100 max-w-48 truncate">
                  {row.file?.name || "Unknown"}
                </td>
                <td className="px-4 py-2.5 text-light-200">
                  {row.tags?.length || 0} tags
                </td>
                <td className="px-4 py-2.5 text-light-200">
                  {row.summary ? "✓ Yes" : "— No"}
                </td>
                <td className="px-4 py-2.5 text-light-200 whitespace-nowrap">
                  {row.processed_at
                    ? new Date(row.processed_at).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-1">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="body-2 font-medium text-brand transition-colors hover:text-brand/80 cursor-pointer underline underline-offset-4 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
