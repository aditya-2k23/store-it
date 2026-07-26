"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Folder, Pencil, RotateCcw, Trash2 } from "lucide-react";
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

export default function FolderCard({ folder }: { folder: FolderItem }) {
  const [renameOpen, setRenameOpen] = useState(false);
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
        role={folder.isTrashed ? undefined : "link"}
        tabIndex={folder.isTrashed ? -1 : 0}
        onClick={() => !folder.isTrashed && router.push(`/files/${folder.id}`)}
        onKeyDown={(event) => {
          if (!folder.isTrashed && event.key === "Enter") router.push(`/files/${folder.id}`);
        }}
        className={`file-card ${folder.isTrashed ? "cursor-default grayscale opacity-60" : "cursor-pointer"}`}
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
                  <RotateCcw className="mr-2 size-4" /> Restore
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => setRenameOpen(true)}>
                    <Pencil className="mr-2 size-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => setMoveOpen(true)}>
                    <Folder className="mr-2 size-4" /> Move to...
                  </DropdownMenuItem>
                  <DropdownMenuItem className="shad-dropdown-item" onClick={() => void handleTrashState()}>
                    <Trash2 className="mr-2 size-4" /> Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="file-card-details">
          <p className="subtitle-2 line-clamp-1">{folder.name}</p>
          {folder.isTrashed && <span className="w-fit rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Trashed</span>}
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
      <MoveToDialog open={moveOpen} onOpenChange={setMoveOpen} itemId={folder.id} itemType="folder" excludeFolderId={folder.id} />
    </>
  );
}
