import { cn, getFileIcon } from "@/lib/utils";
import Image from "next/image";
import React from "react";

interface Props {
  type: string;
  extension: string;
  url?: string;
  thumbnailUrl?: string;
  imageClassName?: string;
  className?: string;
}

const Thumbnail = ({
  type,
  extension,
  url = "",
  thumbnailUrl = "",
  imageClassName,
  className,
}: Props) => {
  const isImage = type === "image" && extension !== "svg";

  // Priority: thumbnailUrl (optimized, stable) → url (blob during upload) → icon
  const displayUrl = thumbnailUrl || url;
  const hasImage = Boolean(displayUrl) && isImage;

  return (
    <figure className={cn("thumbnail", className)}>
      <Image
        src={hasImage ? displayUrl : getFileIcon(extension, type)}
        alt="thumbnail"
        width={100}
        height={100}
        // thumbnailUrl is served from our own /api/thumbnail route (same origin),
        // which returns a properly-sized WebP — no further Next.js optimization needed.
        // url during upload is a blob: URL — also skip optimization.
        unoptimized={hasImage}
        className={cn(
          "size-8 object-contain",
          imageClassName,
          hasImage && "thumbnail-image",
        )}
      />
    </figure>
  );
};

export default Thumbnail;
