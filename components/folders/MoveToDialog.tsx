"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getFoldersForPicker, moveFolder } from "@/lib/actions/folder.actions";
import { moveFileToFolder } from "@/lib/actions/file.actions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MoveToDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: "file" | "folder";
  excludeFolderId?: string;
  currentParentFolderId?: string | null;
};

export default function MoveToDialog({
  open,
  onOpenChange,
  itemId,
  itemType,
  excludeFolderId,
  currentParentFolderId,
}: MoveToDialogProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setSelectedFolderId(undefined);
    setIsLoading(true);
    void getFoldersForPicker(excludeFolderId)
      .then((items) => setFolders((items || []) as FolderItem[]))
      .catch(() => {
        toast({
          description: <p className="body-2">Failed to load folders.</p>,
          className: "error-toast",
        });
      })
      .finally(() => setIsLoading(false));
  }, [excludeFolderId, open]);

  const normalizedCurrentParent = currentParentFolderId ?? null;
  const isSameLocation = selectedFolderId === normalizedCurrentParent;
  const isRootCurrent = normalizedCurrentParent === null;

  const handleMove = async () => {
    if (selectedFolderId === undefined || isSameLocation) return;
    setIsSubmitting(true);
    try {
      if (itemType === "folder") {
        await moveFolder(itemId, selectedFolderId, pathname);
      } else {
        await moveFileToFolder({ fileId: itemId, folderId: selectedFolderId, path: pathname });
      }
      toast({
        description: <p className="body-2">Moved successfully.</p>,
        className: "success-toast",
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({
        description: <p className="body-2">Failed to move item. Please try again.</p>,
        className: "error-toast",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shad-dialog">
        <DialogHeader>
          <DialogTitle className="text-center text-light-100">Move to folder</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-light-300 bg-white p-2">
          <button
            type="button"
            disabled={isRootCurrent}
            onClick={() => setSelectedFolderId(null)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              isRootCurrent
                ? "opacity-50 cursor-not-allowed bg-light-300/30 text-light-200"
                : selectedFolderId === null
                  ? "bg-brand/10 text-brand font-medium cursor-pointer"
                  : "hover:bg-light-300/50 text-light-100 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>/~</span>
              <span className="text-xs font-normal text-light-200">(root)</span>
            </div>
            {isRootCurrent && (
              <span className="text-xs font-normal text-light-200">(current)</span>
            )}
          </button>
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="size-5 animate-spin" /></div>
          ) : (
            folders.map((folder) => {
              const isCurrent = normalizedCurrentParent === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedFolderId(folder.id)}
                  style={{ paddingLeft: `${12 + folder.depth * 20}px` }}
                  className={`flex w-full items-center justify-between rounded-lg py-2 pr-3 text-left text-sm transition-colors ${
                    isCurrent
                      ? "opacity-50 cursor-not-allowed bg-light-300/30 text-light-200"
                      : selectedFolderId === folder.id
                        ? "bg-brand/10 text-brand font-medium cursor-pointer"
                        : "hover:bg-light-300/50 text-light-100 cursor-pointer"
                  }`}
                >
                  <span className="truncate">{folder.name}</span>
                  {isCurrent && (
                    <span className="ml-2 text-xs font-normal text-light-200 flex-shrink-0">(current)</span>
                  )}
                </button>
              );
            })
          )}
        </div>
        <DialogFooter className="flex flex-col gap-3 md:flex-row">
          <Button onClick={() => onOpenChange(false)} className="modal-cancel-button">Cancel</Button>
          <Button
            onClick={() => void handleMove()}
            disabled={isLoading || isSubmitting || selectedFolderId === undefined || isSameLocation}
            className="modal-submit-button"
          >
            Move
            {isSubmitting && <Loader2 className="ml-2 size-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
