"use client";

import { useState } from "react";

interface AiFileRow {
  file_id: string;
  processing_status: string;
  summary: string | null;
  tags: string[] | null;
  processed_at: string | null;
  file: {
    name: string;
  } | null;
}

export default function PrivacyTable({ data }: { data: AiFileRow[] }) {
  const [visibleCount, setVisibleCount] = useState(5);

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

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
            {visibleData.map((row) => (
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
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="body-2 font-medium text-brand transition-colors hover:text-brand/80 cursor-pointer underline underline-offset-4"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
