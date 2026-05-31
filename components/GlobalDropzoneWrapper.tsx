"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface GlobalDropzoneWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const GlobalDropzoneWrapper = ({
  children,
  className,
}: GlobalDropzoneWrapperProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // For now, we simulate the upload UI
    if (acceptedFiles.length > 0) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false);
      }, 3000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn("relative h-full w-full", className)}
    >
      <input {...getInputProps()} />
      {children}

      {/* Drag Active Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300 pointer-events-none rounded-[30px]">
          <div className="absolute inset-6 border-[3px] border-dashed border-brand rounded-[30px] bg-brand/5 flex flex-col items-center justify-center shadow-drop-3">
            <div className="bg-white px-8 py-5 rounded-[24px] shadow-drop-2 flex items-center gap-5 transition-transform scale-105 pointer-events-none border border-light-300">
              <div className="p-3 bg-brand rounded-xl shadow-sm">
                <Image
                  src="/assets/icons/upload.svg"
                  alt="Upload"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <h2 className="text-brand font-dynapuff text-2xl mb-1">
                  Drop files to upload
                </h2>
                <p className="text-light-100 font-medium text-sm">
                  Release to securely save to your space
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Status Overlay (Simulation for now) */}
      {isUploading && (
        <div className="fixed bottom-10 right-10 z-50 flex items-center gap-4 p-5 bg-white rounded-2xl shadow-drop-3 border border-light-300 animate-in slide-in-from-bottom-5">
          <Image
            src="/assets/icons/file-loader.gif"
            alt="Uploading"
            width={40}
            height={40}
          />
          <div>
            <h4 className="h4 text-dark-200">Uploading files...</h4>
            <p className="caption text-light-100">
              Please wait while we process your files
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalDropzoneWrapper;
