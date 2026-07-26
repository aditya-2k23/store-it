"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createFolder } from "@/lib/actions/folder.actions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CreateFolderDialog({
  parentFolderId,
}: {
  parentFolderId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsPending(true);
    try {
      await createFolder(name, parentFolderId, pathname);
      toast({
        description: <p className="body-2">Folder created successfully.</p>,
        className: "success-toast",
      });
      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      toast({
        description: (
          <p className="body-2">Failed to create folder. Please try again.</p>
        ),
        className: "error-toast",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-brand text-white hover:bg-brand/90 cursor-pointer">
          <Plus className="mr-2 size-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog">
        <DialogHeader>
          <DialogTitle className="text-center text-light-100">
            New Folder
          </DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleCreate();
          }}
          placeholder="Folder name"
          className="shad-no-focus h-12 rounded-xl border border-light-300 bg-white px-4 text-light-100 placeholder:text-light-200 focus:border-brand"
        />
        <DialogFooter className="flex flex-col gap-3 md:flex-row">
          <Button
            onClick={() => setOpen(false)}
            className="modal-cancel-button cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={isPending || !name.trim()}
            className="modal-submit-button cursor-pointer"
          >
            Create
            {isPending && <Loader2 className="ml-2 size-4 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
