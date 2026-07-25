"use client";

import { useState } from "react";
import Link from "next/link";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionsDropdown from "@/components/ActionsDropdown";
import EmptyState from "@/components/EmptyState";
import { ChevronDown, UploadCloud, Trash2 } from "lucide-react";

interface DashboardAccordionProps {
  uploadedFiles: any[];
  trashedFiles: any[];
}

export default function DashboardAccordion({
  uploadedFiles,
  trashedFiles,
}: DashboardAccordionProps) {
  const [openSection, setOpenSection] = useState<"uploaded" | "deleted" | null>(
    "uploaded",
  );

  return (
    <div className="flex flex-col gap-4 w-full h-fit self-start">
      {/* Recently Uploaded Container */}
      <section className="dashboard-recent-files h-fit transition-all duration-300">
        <div className="flex flex-col">
          <button
            onClick={() =>
              setOpenSection(
                openSection === "uploaded" ? "deleted" : "uploaded",
              )
            }
            className="flex items-center justify-between w-full text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center p-2 rounded-xl bg-brand/10 text-brand">
                <UploadCloud className="size-5" />
              </div>
              <h2 className="h5 md:h3 xl:h2 text-light-100 font-dynapuff tracking-wider">
                Recently uploaded files
              </h2>
            </div>
            <ChevronDown
              className={`size-6 text-light-100 transition-transform duration-300 ${
                openSection === "uploaded" ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              openSection === "uploaded"
                ? "grid-rows-[1fr] opacity-100 mt-5"
                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              {uploadedFiles.length > 0 ? (
                <ul className="flex flex-col gap-5 pb-2">
                  {uploadedFiles.map((file: any) => (
                    <Link
                      href={file.downloadUrl || file.url || "#"}
                      target="_blank"
                      className="flex items-center gap-3"
                      key={file.id}
                    >
                      <Thumbnail
                        type={file.type}
                        extension={file.extension}
                        url={file.url}
                      />
                      <div className="recent-file-details">
                        <div className="flex flex-col gap-1">
                          <p className="recent-file-name">{file.name}</p>
                          <FormattedDateTime
                            date={file.createdAt}
                            className="caption"
                          />
                        </div>
                        <ActionsDropdown file={file} />
                      </div>
                    </Link>
                  ))}
                </ul>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Deleted Container */}
      <section className="dashboard-recent-files h-fit transition-all duration-300">
        <div className="flex flex-col">
          <button
            onClick={() =>
              setOpenSection(openSection === "deleted" ? "uploaded" : "deleted")
            }
            className="flex items-center justify-between w-full text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center p-2 rounded-xl bg-red/10 text-red">
                <Trash2 className="size-5" />
              </div>
              <h2 className="h5 md:h3 xl:h2 text-light-100 font-dynapuff tracking-wider">
                Recently deleted items
              </h2>
            </div>
            <ChevronDown
              className={`size-6 text-light-100 transition-transform duration-300 ${
                openSection === "deleted" ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              openSection === "deleted"
                ? "grid-rows-[1fr] opacity-100 mt-5"
                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              {trashedFiles.length > 0 ? (
                <ul className="flex flex-col gap-5 pb-2">
                  {trashedFiles.map((file: any) => (
                    <Link
                      href={file.downloadUrl || file.url || "#"}
                      target="_blank"
                      className="flex items-center gap-3"
                      key={file.id}
                    >
                      <Thumbnail
                        type={file.type}
                        extension={file.extension}
                        url={file.url}
                      />
                      <div className="recent-file-details">
                        <div className="flex flex-col gap-1">
                          <p className="recent-file-name">{file.name}</p>
                          <FormattedDateTime
                            date={file.trashedAt || file.createdAt}
                            className="caption"
                          />
                        </div>
                        <ActionsDropdown file={file} />
                      </div>
                    </Link>
                  ))}
                </ul>
              ) : (
                <EmptyState type="trash" showUpload={false} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
