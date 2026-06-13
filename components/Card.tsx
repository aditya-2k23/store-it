import Link from "next/link";
import React from "react";
import Thumbnail from "./Thumbnail";
import { convertFileSize } from "@/lib/utils";
import FormattedDateTime from "./FormattedDateTime";
import ActionsDropdown from "./ActionsDropdown";

const Card = ({ file }: { file: FileItem }) => {
  const fileHref = file.downloadUrl || file.url || "#";

  return (
    <Link href={fileHref} target="_blank" className="file-card">
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.url}
          thumbnailUrl={file.thumbnailUrl}
          className="size-20!"
          imageClassName="size-11!"
        />

        <div className="flex flex-col items-end justify-between">
          <ActionsDropdown file={file} />

          <p className="body-1">{convertFileSize(file.size)}</p>
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>

        {file.tags && file.tags.length > 0 && file.aiStatus === "completed" && (
          <div className="flex flex-wrap gap-1 mt-1">
            {file.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20"
              >
                {tag}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-light-300 text-light-200">
                +{file.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <FormattedDateTime
          date={file.createdAt}
          className="body-2 text-light-100"
        />

        <p className="caption line-clamp-1 text-light-200">
          By: {file.owner.fullName}
        </p>
      </div>
    </Link>
  );
};

export default Card;
