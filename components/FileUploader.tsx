"use client";

import React, { useCallback, useState } from "react";

import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn, convertFileToUrl, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";

interface Props {
  className?: string;
}

const FileUploader = ({ className }: Props) => {
  const path = usePathname();
  const { toast } = useToast();
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const [uploadProgresses, setUploadProgresses] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map(file => ({
        id: crypto.randomUUID(),
        file
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Initialize progress for each file
      setUploadProgresses((prev) => {
        const newProgresses = { ...prev };
        newFiles.forEach(({ id }) => {
          newProgresses[id] = 0;
        });
        return newProgresses;
      });

      const uploadPromises = newFiles.map(async ({ id, file }) => {
        if (file.size > MAX_FILE_SIZE) {
          setFiles((prevFiles) =>
            prevFiles.filter((f) => f.id !== id)
          );

          return toast({
            description: (
              <p className="body-2">
                <span className="font-semibold">{file.name}</span> is too large.
                Max file size is 50MB.
              </p>
            ),
            className: "error-toast",
          });
        }

        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          if (progress > 90) {
            clearInterval(progressInterval);
          }
          setUploadProgresses((prev) => ({
            ...prev,
            [id]: Math.min(progress, 90),
          }));
        }, 150);

        return uploadFile({ file, path })
          .then((uploadedFile) => {
            clearInterval(progressInterval);
            
            if (uploadedFile) {
              setUploadProgresses((prev) => ({
                ...prev,
                [id]: 100,
              }));
              setFiles((prevFiles) =>
                prevFiles.filter((f) => f.id !== id)
              );
              toast({
                title: "Success",
                description: (
                  <p className="body-2 text-dark-100">
                    <span className="font-semibold text-green">{file.name}</span> has been uploaded successfully
                  </p>
                ),
                className: "success-toast",
              });
            } else {
              setFiles((prevFiles) =>
                prevFiles.filter((f) => f.id !== id)
              );
              toast({
                title: "Error",
                description: (
                  <p className="body-2">
                    Failed to upload <span className="font-semibold">{file.name}</span>
                  </p>
                ),
                className: "error-toast",
              });
            }
          })
          .catch(() => {
            clearInterval(progressInterval);
            setFiles((prevFiles) =>
              prevFiles.filter((f) => f.id !== id)
            );
            toast({
              title: "Error",
              description: (
                <p className="body-2">
                  Failed to upload <span className="font-semibold">{file.name}</span>
                </p>
              ),
              className: "error-toast",
            });
          });
      });

      await Promise.all(uploadPromises);
    },
    [path, toast]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    id: string
  ) => {
    e.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
  };

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input {...getInputProps()} />
      <Button type="button" className={cn("uploader-button bg-brand hover:bg-brand-100 rounded-full text-[14px] leading-5 font-medium h-13 px-10 shadow-drop-1", className)}>
        <Image
          src="/assets/icons/upload.svg"
          alt="upload"
          width={24}
          height={24}
        />{" "}
        <p>Upload</p>
      </Button>
      {files.length > 0 && (
        <ul className="uploader-preview-list">
          <h4 className="h4 text-light-100">Uploading</h4>

          {files.map(({ id, file }) => {
            const { type, extension } = getFileType(file.name);
            const currentProgress = uploadProgresses[id] || 0;

            return (
              <li
                key={id}
                className="uploader-preview-item"
              >
                <div className="flex items-center gap-3">
                  <Thumbnail
                    type={type}
                    extension={extension}
                    url={convertFileToUrl(file)}
                  />

                  <div className="preview-item-name flex items-center gap-2">
                    <span className="truncate">{file.name}</span>
                    <Image
                      src="/assets/icons/file-loader.gif"
                      width={80}
                      height={26}
                      alt="Loader"
                    />
                    <span className="text-brand text-[12px] font-semibold">{currentProgress}%</span>
                  </div>
                </div>

                <Image
                  src="/assets/icons/remove.svg"
                  width={24}
                  height={24}
                  alt="Remove"
                  onClick={(e) => handleRemoveFile(e, id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
