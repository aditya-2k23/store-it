"use client";

import { useEffect, useState } from "react";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";

const ImageThumbnail = ({ file }: { file: FileItem }) => (
  <div className="file-details-thumbnail">
    <Thumbnail
      type={file.type}
      extension={file.extension}
      url={file.url}
      thumbnailUrl={file.thumbnailUrl}
    />

    <div className="flex-col flex">
      <p className="subtitle-2 mb-1">{file.name}</p>
      <FormattedDateTime date={file.createdAt} className="caption" />
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex">
    <p className="file-details-label">{label}</p>
    <p className="file-details-value">{value}</p>
  </div>
);

type AiSummaryStatus =
  | "loading"
  | "completed"
  | "not_applicable"
  | "processing"
  | "pending"
  | "failed";

const AiSummarySection = ({ fileId }: { fileId: string }) => {
  const [status, setStatus] = useState<AiSummaryStatus>("loading");
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/ai/summary/${fileId}`);
        if (!res.ok) {
          setStatus("failed");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setSummary(data.summary);
          setStatus(data.status as AiSummaryStatus);
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    };

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // Don't render the section at all for not_applicable files
  if (status === "not_applicable") return null;

  return (
    <div className="mt-3 border-t border-light-400 pt-3">
      <p className="file-details-label mb-1.5">AI Summary</p>

      {status === "loading" && (
        <div className="h-4 w-full animate-pulse rounded bg-brand/15" />
      )}

      {(status === "processing" || status === "pending") && (
        <p className="text-xs text-light-200">Still processing...</p>
      )}

      {status === "failed" && (
        <p className="text-xs text-light-200">Summary unavailable</p>
      )}

      {status === "completed" && summary && (
        <p className="body-2 text-light-100">{summary}</p>
      )}
    </div>
  );
};

export const FileDetails = ({ file }: { file: FileItem }) => {
  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-2">
        <DetailRow label="Format:" value={file.extension} />
        <DetailRow label="Size:" value={convertFileSize(file.size)} />
        <DetailRow label="Owner:" value={file.owner.fullName} />
        <DetailRow label="Last edit:" value={formatDateTime(file.updatedAt)} />
      </div>

      <AiSummarySection fileId={file.id} />
    </>
  );
};

interface Props {
  file: FileItem;
  onInputChange: (emails: string[]) => void;
  onRemove: (email: string) => void;
}

export const ShareInput = ({ file, onInputChange, onRemove }: Props) => {
  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-1 text-light-100">
          Share file with other users
        </p>

        <Input
          type="email"
          placeholder="Enter email address"
          onChange={(e) => onInputChange(e.target.value.trim().split(","))}
          className="share-input-field"
        />

        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared with</p>
            <p className="subtitle-2 text-light-200">
              {file.sharedWith.length} users
            </p>
          </div>

          <ul className="pt-2">
            {file.sharedWith.map((email: string) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2"
              >
                <p className="subtitle-2">{email}</p>
                <Button
                  onClick={() => onRemove(email)}
                  className="share-remove-user"
                >
                  <Image
                    src="/assets/icons/remove.svg"
                    alt="remove"
                    width={24}
                    height={24}
                    className="remove-icon"
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
