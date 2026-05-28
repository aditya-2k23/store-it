import { cn, getFileIcon } from "@/lib/utils";
import Image from "next/image";
import React from "react";

interface Props {
  type: string;
  extension: string;
  url?: string;
  imageClassName?: string;
  className?: string;
}

const Thumbnail = ({
  type,
  extension,
  url = "",
  imageClassName,
  className,
}: Props) => {
  const isImage = type === "image" && extension !== "svg";
  const hasImage = Boolean(url) && isImage;
  const unoptimized = process.env.NODE_ENV === "development" && hasImage;

  return (
    <figure className={cn("thumbnail", className)}>
      <Image
        src={hasImage ? url : getFileIcon(extension, type)}
        alt="thumbnail"
        width={100}
        height={100}
        unoptimized={unoptimized}
        className={cn(
          "size-8 object-contain",
          imageClassName,
          hasImage && "thumbnail-image"
        )}
      />
    </figure>
  );
};

export default Thumbnail;
