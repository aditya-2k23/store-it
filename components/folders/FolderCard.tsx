"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Folder } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { renameFolder, restoreFolder, trashFolder } from "@/lib/actions/folder.actions";
import FormattedDateTime from "@/components/FormattedDateTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MoveToDialog from "./MoveToDialog";

export default function FolderCard({
  folder,
  allowTrashedNavigation = true,
}: {
  folder: FolderItem;
  allowTrashedNavigation?: boolean;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [name, setName] = useState(folder.name);
  const [isPending, setIsPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const complete = (description: string) => {
    toast({ description: <p className="body-2">{description}</p>, className: "success-toast" });
    router.refresh();
  };

  const handleRename = async () => {
    setIsPending(true);
    try {
      await renameFolder(folder.id, name, pathname);
      setRenameOpen(false);
      complete("Folder renamed successfully.");
    } catch {
      toast({ description: <p className="body-2">Failed to rename folder.</p>, className: "error-toast" });
    } finally {
      setIsPending(false);
    }
  };

  const handleTrashState = async () => {
    setIsPending(true);
    try {
      if (folder.isTrashed) {
        await restoreFolder(folder.id, pathname);
        complete("Folder restored successfully.");
      } else {
        await trashFolder(folder.id, pathname);
        complete("Folder moved to trash.");
      }
    } catch {
      toast({ description: <p className="body-2">Failed to update folder.</p>, className: "error-toast" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div
        role={!folder.isTrashed || allowTrashedNavigation ? "link" : undefined}
        tabIndex={!folder.isTrashed || allowTrashedNavigation ? 0 : -1}
        onClick={() =>
          (!folder.isTrashed || allowTrashedNavigation) &&
          router.push(`/files/${folder.id}`)
        }
        onKeyDown={(event) => {
          if (
            (!folder.isTrashed || allowTrashedNavigation) &&
            event.key === "Enter"
          ) {
            router.push(`/files/${folder.id}`);
          }
        }}
        className={`file-card ${folder.isTrashed && !allowTrashedNavigation ? "cursor-default grayscale opacity-60" : "cursor-pointer"} ${folder.isTrashed ? "grayscale opacity-60" : ""}`}
      >
        <div className="flex justify-between">
          <Folder className="size-16 fill-brand/20 text-brand" />
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(event) => event.stopPropagation()}
              className="shad-no-focus cursor-pointer rounded-full p-1 transition-all duration-200 hover:bg-light-300 active:scale-95"
              aria-label={`Actions for ${folder.name}`}
            >
              <Image
                src="/assets/icons/dots.svg"
                alt="dots"
                width={34}
                height={34}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(event) => event.stopPropagation()}>
              <DropdownMenuLabel className="max-w-50 truncate">{folder.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {folder.isTrashed ? (
                <DropdownMenuItem className="shad-dropdown-item" onClick={() => void handleTrashState()}>
                  <div className="flex items-center gap-2">
                    <Image src="/assets/icons/restore.svg" alt="Restore" width={30} height={30} />
                    Restore
                  </div>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => setRenameOpen(true)}>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/icons/edit.svg" alt="Rename" width={30} height={30} />
                      Rename
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => setDetailsOpen(true)}>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/icons/info.svg" alt="Details" width={30} height={30} />
                      Details
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => setMoveOpen(true)}>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/icons/move.svg" alt="Move to folder" width={30} height={30} />
                      Move to...
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => void handleTrashState()}>
                    <div className="flex items-center gap-2">
                      <Image src="/assets/icons/delete.svg" alt="Trash" width={30} height={30} />
                      Trash
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="file-card-details">
          <p className="subtitle-2 line-clamp-1">{folder.name}</p>
          {folder.isTrashed && <span className="w-fit rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Trashed</span>}
          <p className="caption text-light-200">
            {folder.fileCount} file{folder.fileCount === 1 ? "" : "s"} · {folder.itemCount} item{folder.itemCount === 1 ? "" : "s"}
          </p>
          <FormattedDateTime
            date={folder.createdAt}
            className="body-2 text-light-100"
          />
          <p className="caption line-clamp-1 text-light-200">
            By: {folder.owner?.fullName || "Unknown"}
          </p>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="shad-dialog">
          <DialogHeader><DialogTitle className="text-center text-light-100">Rename Folder</DialogTitle></DialogHeader>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={() => setRenameOpen(false)} className="modal-cancel-button">Cancel</Button>
            <Button onClick={() => void handleRename()} disabled={isPending || !name.trim()} className="modal-submit-button">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="shad-dialog">
          <DialogHeader><DialogTitle className="text-center text-light-100">Folder details</DialogTitle></DialogHeader>
          <div className="space-y-2 body-2 text-light-100">
            <p><span className="text-light-200">Name:</span> {folder.name}</p>
            <p><span className="text-light-200">Files:</span> {folder.fileCount}</p>
            <p><span className="text-light-200">Items:</span> {folder.itemCount}</p>
          </div>
        </DialogContent>
      </Dialog>
      <MoveToDialog open={moveOpen} onOpenChange={setMoveOpen} itemId={folder.id} itemType="folder" excludeFolderId={folder.id} />
    </>
  );
}
