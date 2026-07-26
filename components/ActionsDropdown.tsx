"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import Image from "next/image";
import { actionsDropdownItems, trashedActionsDropdownItems } from "@/constants";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  permanentlyDeleteFile,
  renameFile,
  restoreFile,
  trashFile,
  updateFileUsers,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, ShareInput } from "./ActionsModalContent";
import { toast } from "@/hooks/use-toast";

type ToastAction =
  | "rename"
  | "share"
  | "delete"
  | "restore"
  | "delete_forever";

const ActionsDropdown = ({ file }: { file: FileItem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);

  const path = usePathname();
  const dropdownItems = file.isTrashed
    ? trashedActionsDropdownItems
    : actionsDropdownItems;

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
    setEmails([]);
  };

  const handleAction = async (action: ActionType) => {
    if (!action) return;
    setIsLoading(true);

    const actions: Record<string, () => Promise<unknown>> = {
      rename: () =>
        renameFile({
          fileId: file.id,
          name,
          extension: file.extension,
          path,
        }),
      share: () => updateFileUsers({ fileId: file.id, emails, path }),
      delete: () =>
        trashFile({
          fileId: file.id,
          path,
        }),
      restore: () => restoreFile({ fileId: file.id, path }),
      delete_forever: () => permanentlyDeleteFile({ fileId: file.id, path }),
    };

    try {
      const success = await actions[action.value as keyof typeof actions]();

      if (success) {
        // Toast messages for successful actions
        const toastDescription: { [key in ToastAction]: React.ReactNode } = {
          rename: (
            <p className="body-2">
              File <span className="font-semibold">{file.name}</span> renamed
              successfully.
            </p>
          ),
          share: (
            <p className="body-2">
              File <span className="font-semibold">{file.name}</span> shared
              successfully with {emails.join(", ")}.
            </p>
          ),
          delete: (
            <p className="body-2">
              File <span className="font-semibold">{file.name}</span> moved to
              trash.
            </p>
          ),
          restore: (
            <p className="body-2">
              File <span className="font-semibold">{file.name}</span> restored
              successfully.
            </p>
          ),
          delete_forever: (
            <p className="body-2">
              File <span className="font-semibold">{file.name}</span> deleted
              permanently.
            </p>
          ),
        };

        // Triggering the toast
        toast({
          description: toastDescription[action.value as ToastAction],
          className: "success-toast",
        });

        closeAllModals(); // Close modals on success
      } else {
        // Handle failure explicitly
        throw new Error("Operation failed.");
      }
    } catch (error) {
      // Error toast
      toast({
        description: (
          <p className="body-2">
            Failed to {action.value}{" "}
            <span className="font-semibold">{file.name}</span>. Please try
            again.
          </p>
        ),
        className: "error-toast",
      });
    }

    setIsLoading(false);
  };

  const handleRemoveUser = async (email: string) => {
    const updatedEmails = emails.filter((e) => e !== email);

    const success = await updateFileUsers({
      fileId: file.id,
      emails: updatedEmails,
      path,
    });

    if (success) setEmails(updatedEmails);

    closeAllModals();
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { value, label } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={setEmails}
              onRemove={handleRemoveUser}
            />
          )}
          {value === "delete" && (
            <p className="delete-confirmation">
              Move{` `}
              <span className="delete-file-name">{file.name}</span>?
            </p>
          )}
          {value === "delete_forever" && (
            <p className="delete-confirmation">
              Permanently delete{` `}
              <span className="delete-file-name">{file.name}</span>? This
              cannot be undone.
            </p>
          )}
        </DialogHeader>
        {["rename", "delete", "share", "delete_forever"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModals} className="modal-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={() => handleAction(action)}
              className="modal-submit-button"
            >
              <p className="capitalize">
                {value === "delete_forever" ? "Delete forever" : value}
              </p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-50 truncate">
            {file.name}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {dropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);

                if (actionItem.value === "restore") {
                  void handleAction(actionItem);
                  return;
                }

                if (
                  [
                    "rename",
                    "share",
                    "delete",
                    "delete_forever",
                    "details",
                  ].includes(
                    actionItem.value
                  )
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={file.downloadUrl || file.url || "#"}
                  download={file.name}
                  className="flex items-center gap-2"
                >
                  {actionItem.icon && (
                    <Image
                      src={actionItem.icon}
                      alt={actionItem.label}
                      width={30}
                      height={30}
                    />
                  )}
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  {actionItem.icon && (
                    <Image
                      src={actionItem.icon}
                      alt={actionItem.label}
                      width={30}
                      height={30}
                    />
                  )}
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};

export default ActionsDropdown;
