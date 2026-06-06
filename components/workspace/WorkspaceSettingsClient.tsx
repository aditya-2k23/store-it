"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  renameWorkspace,
  updateMemberRole,
  removeMember,
  createInviteLink,
  revokeInviteLink,
  transferOwnership,
  deleteWorkspace,
} from "@/lib/actions/workspace.actions";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Home,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerChildren } from "@/components/landing/animations";

interface WorkspaceSettingsClientProps {
  workspace: WorkspaceWithRole;
  userRole: WorkspaceRole;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  currentUserId: string;
}

const roleBadgeStyles: Record<WorkspaceRole, string> = {
  owner: "bg-brand/10 text-brand",
  admin: "bg-blue/10 text-blue",
  editor: "bg-green/10 text-green",
  viewer: "bg-light-300 text-light-100",
};

// ——— Section 1: General ———
const GeneralSection = ({
  workspace,
}: {
  workspace: WorkspaceWithRole;
}) => {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!name.trim() || name.trim() === workspace.name) return;
    startTransition(async () => {
      try {
        await renameWorkspace(workspace.id, name.trim());
        toast({
          description: (
            <p className="body-2 text-white">Workspace renamed successfully.</p>
          ),
          className: "success-toast",
        });
        router.refresh();
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">Failed to rename workspace.</p>
          ),
          className: "error-toast",
        });
      }
    });
  };

  return (
    <motion.section variants={fadeIn}>
      <h3 className="h3 text-dark-100">General</h3>
      <div className="mt-4 flex gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 max-w-sm rounded-xl border border-light-300 px-4 text-sm"
        />
        <Button
          onClick={handleSave}
          disabled={isPending || !name.trim() || name.trim() === workspace.name}
          className="primary-btn h-11 gap-2 px-6 text-white"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
      </div>
      {workspace.slug && (
        <p className="caption mt-2 text-light-200">
          Slug: <span className="font-medium">{workspace.slug}</span>
        </p>
      )}
    </motion.section>
  );
};

// ——— Section 2: Members ———
const MembersSection = ({
  workspace,
  userRole,
  members,
  currentUserId,
}: {
  workspace: WorkspaceWithRole;
  userRole: WorkspaceRole;
  members: WorkspaceMember[];
  currentUserId: string;
}) => {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<WorkspaceMember | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const canModifyRoles =
    userRole === "owner" || userRole === "admin";
  const canRemoveMembers =
    userRole === "owner" || userRole === "admin";

  const getRoleOptions = (targetRole: WorkspaceRole): WorkspaceRole[] => {
    if (userRole === "owner") return ["admin", "editor", "viewer"];
    if (userRole === "admin") return ["editor", "viewer"];
    return [];
  };

  const handleRoleChange = (
    targetUserId: string,
    newRole: WorkspaceRole,
  ) => {
    startTransition(async () => {
      try {
        await updateMemberRole(workspace.id, targetUserId, newRole);
        toast({
          description: (
            <p className="body-2 text-white">Member role updated.</p>
          ),
          className: "success-toast",
        });
        router.refresh();
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">Failed to update role.</p>
          ),
          className: "error-toast",
        });
      }
    });
  };

  const handleRemove = () => {
    if (!confirmRemove) return;
    setRemovingId(confirmRemove.userId);
    startTransition(async () => {
      try {
        await removeMember(workspace.id, confirmRemove.userId);
        toast({
          description: (
            <p className="body-2 text-white">
              <span className="font-semibold">
                {confirmRemove.user.fullName || confirmRemove.user.email}
              </span>{" "}
              removed from workspace.
            </p>
          ),
          className: "success-toast",
        });
        setConfirmRemove(null);
        router.refresh();
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">Failed to remove member.</p>
          ),
          className: "error-toast",
        });
      } finally {
        setRemovingId(null);
      }
    });
  };

  return (
    <motion.section variants={fadeIn}>
      <h3 className="h3 text-dark-100">Members</h3>
      <p className="caption mt-1 text-light-200">
        {members.length} {members.length === 1 ? "member" : "members"}
      </p>

      <div className="mt-4 space-y-2">
        {members.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const isOwner = member.role === "owner";
          const initial = (
            member.user.fullName?.[0] ||
            member.user.email[0] ||
            "?"
          ).toUpperCase();

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-xl border border-light-300 bg-white p-3 transition-colors hover:bg-light-400/30"
            >
              {/* Avatar */}
              {member.user.avatarUrl ? (
                <img
                  src={member.user.avatarUrl}
                  alt={member.user.fullName || "Avatar"}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {initial}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="body-2 truncate font-medium text-dark-100">
                  {member.user.fullName || "Unnamed"}
                  {isCurrentUser && (
                    <span className="ml-1 text-light-200">(you)</span>
                  )}
                </p>
                <p className="caption truncate text-light-200">
                  {member.user.email}
                </p>
              </div>

              {/* Role badge / selector */}
              {canModifyRoles && !isCurrentUser && !isOwner ? (
                <Select
                  value={member.role}
                  onValueChange={(val) =>
                    handleRoleChange(member.userId, val as WorkspaceRole)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-24 rounded-full border-0 px-3 text-[11px] font-semibold capitalize",
                      roleBadgeStyles[member.role as WorkspaceRole],
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getRoleOptions(member.role as WorkspaceRole).map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="capitalize"
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold capitalize",
                    roleBadgeStyles[member.role as WorkspaceRole],
                  )}
                >
                  {member.role}
                </span>
              )}

              {/* Remove button */}
              {canRemoveMembers && !isCurrentUser && !isOwner && (
                <button
                  onClick={() => setConfirmRemove(member)}
                  disabled={removingId === member.userId}
                  className="rounded-lg p-1.5 text-red transition-colors hover:bg-red/10"
                >
                  {removingId === member.userId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <DialogContent className="shad-dialog">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">
              Remove Member
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-light-100">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-brand-100">
              {confirmRemove?.user.fullName || confirmRemove?.user.email}
            </span>{" "}
            from this workspace?
          </p>
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button
              onClick={() => setConfirmRemove(null)}
              className="modal-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemove}
              disabled={isPending}
              className="modal-submit-button"
            >
              Remove
              {isPending && (
                <Loader2 className="ml-2 size-4 animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

// ——— Section 3: Invite Link ———
const InviteLinkSection = ({
  workspace,
  userRole,
  invitations: initialInvitations,
}: {
  workspace: WorkspaceWithRole;
  userRole: WorkspaceRole;
  invitations: WorkspaceInvitation[];
}) => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [generatedLink, setGeneratedLink] = useState<{
    url: string;
    invitationId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Show existing pending invitations
  const [existingInvitations, setExistingInvitations] =
    useState(initialInvitations);

  const roleOptions: ("admin" | "editor" | "viewer")[] =
    userRole === "owner"
      ? ["editor", "viewer", "admin"]
      : ["editor", "viewer"];

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await createInviteLink(workspace.id, selectedRole);
        if (result) {
          setGeneratedLink({
            url: result as string,
            invitationId: "", // We'll get this from the invitations list refresh
          });
          toast({
            description: (
              <p className="body-2 text-white">Invite link generated.</p>
            ),
            className: "success-toast",
          });
          router.refresh();
        }
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">Failed to generate invite link.</p>
          ),
          className: "error-toast",
        });
      }
    });
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (invitationId: string) => {
    setRevoking(true);
    startTransition(async () => {
      try {
        await revokeInviteLink(invitationId);
        setGeneratedLink(null);
        setExistingInvitations((prev) =>
          prev.filter((inv) => inv.id !== invitationId),
        );
        toast({
          description: (
            <p className="body-2 text-white">Invite link revoked.</p>
          ),
          className: "success-toast",
        });
        setConfirmRevoke(false);
        router.refresh();
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">Failed to revoke invite link.</p>
          ),
          className: "error-toast",
        });
      } finally {
        setRevoking(false);
      }
    });
  };

  return (
    <motion.section variants={fadeIn}>
      <h3 className="h3 text-dark-100">Invite Link</h3>

      <div className="mt-4 flex items-end gap-3">
        <div>
          <label className="caption mb-1.5 block font-medium text-light-100">
            Role
          </label>
          <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as "admin" | "editor" | "viewer")}>
            <SelectTrigger className="h-11 w-32 rounded-xl border border-light-300 text-sm capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          className="primary-btn h-11 gap-2 px-6 text-white"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Generate invite link"
          )}
        </Button>
      </div>

      {/* Generated link display */}
      {generatedLink && (
        <div className="mt-4 flex items-center gap-2">
          <Input
            value={generatedLink.url}
            readOnly
            className="h-11 flex-1 rounded-xl border border-light-300 bg-light-400/50 px-4 text-sm text-light-100"
          />
          <Button
            onClick={() => handleCopy(generatedLink.url)}
            variant="outline"
            className="h-11 gap-1.5 rounded-xl border-light-300 px-4"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}

      {/* Existing pending invitations */}
      {existingInvitations.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="caption font-medium text-light-100">
            Pending invitations
          </p>
          {existingInvitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-xl border border-light-300 bg-white p-3"
            >
              <span className="caption flex-1 truncate text-light-100">
                {window.location.origin}/invite/{inv.token}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize",
                  roleBadgeStyles[inv.role as WorkspaceRole] ||
                    "bg-light-300 text-light-100",
                )}
              >
                {inv.role}
              </span>
              <button
                onClick={() => handleRevoke(inv.id)}
                disabled={revoking}
                className="caption font-semibold text-red transition-colors hover:text-red/80"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="caption mt-3 text-light-200">
        Each link expires in 7 days and can only be used once.
      </p>
    </motion.section>
  );
};

// ——— Section 4: Danger Zone ———
const DangerZoneSection = ({
  workspace,
  members,
  currentUserId,
}: {
  workspace: WorkspaceWithRole;
  members: WorkspaceMember[];
  currentUserId: string;
}) => {
  const router = useRouter();
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const nonOwnerMembers = members.filter(
    (m) => m.role !== "owner" && m.userId !== currentUserId,
  );
  const isPersonal = workspace.type === "personal";

  const handleTransfer = () => {
    if (!transferTarget) return;
    startTransition(async () => {
      try {
        await transferOwnership(workspace.id, transferTarget);
        toast({
          description: (
            <p className="body-2 text-white">
              Ownership transferred successfully.
            </p>
          ),
          className: "success-toast",
        });
        setConfirmTransfer(false);
        router.push("/dashboard");
        router.refresh();
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">
              Failed to transfer ownership.
            </p>
          ),
          className: "error-toast",
        });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteWorkspace(workspace.id);
        toast({
          description: (
            <p className="body-2 text-white">Workspace deleted.</p>
          ),
          className: "success-toast",
        });
        setConfirmDelete(false);
        router.push("/workspaces");
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">
              Failed to delete workspace.
            </p>
          ),
          className: "error-toast",
        });
      }
    });
  };

  return (
    <motion.section variants={fadeIn}>
      <div className="rounded-xl border border-red/30 p-6">
        <h3 className="h3 flex items-center gap-2 text-red">
          <AlertTriangle className="size-5" />
          Danger Zone
        </h3>

        {/* Transfer ownership */}
        {nonOwnerMembers.length > 0 && (
          <div className="mt-6">
            <label className="body-2 mb-2 block font-medium text-light-100">
              Transfer ownership
            </label>
            <div className="flex items-end gap-3">
              <Select value={transferTarget} onValueChange={setTransferTarget}>
                <SelectTrigger className="h-11 w-60 rounded-xl border border-light-300 text-sm">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {nonOwnerMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.user.fullName || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setConfirmTransfer(true)}
                disabled={!transferTarget}
                variant="outline"
                className="h-11 rounded-xl border-red/30 text-red hover:bg-red/5 hover:text-red"
              >
                Transfer
              </Button>
            </div>
          </div>
        )}

        {/* Delete workspace */}
        {!isPersonal && (
          <div className="mt-6">
            <label className="body-2 mb-2 block font-medium text-light-100">
              Delete workspace
            </label>
            <p className="caption mb-3 text-light-200">
              This action cannot be undone. All files and members will be
              permanently removed.
            </p>
            <Button
              onClick={() => setConfirmDelete(true)}
              variant="outline"
              className="h-11 rounded-xl border-red text-red hover:bg-red/5 hover:text-red"
            >
              Delete workspace
            </Button>
          </div>
        )}
      </div>

      {/* Transfer confirmation dialog */}
      <Dialog open={confirmTransfer} onOpenChange={setConfirmTransfer}>
        <DialogContent className="shad-dialog">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">
              Transfer Ownership
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-light-100">
            Are you sure? You will become an admin after transfer.
          </p>
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button
              onClick={() => setConfirmTransfer(false)}
              className="modal-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={isPending}
              className="modal-submit-button"
            >
              Transfer
              {isPending && (
                <Loader2 className="ml-2 size-4 animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="shad-dialog">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">
              Delete Workspace
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-light-100">
            Type{" "}
            <span className="font-semibold text-brand-100">
              {workspace.name}
            </span>{" "}
            to confirm deletion.
          </p>
          <Input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={workspace.name}
            className="h-11 rounded-xl border border-light-300 px-4 text-sm"
          />
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button
              onClick={() => {
                setConfirmDelete(false);
                setDeleteInput("");
              }}
              className="modal-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending || deleteInput !== workspace.name}
              className="modal-submit-button bg-red hover:bg-red/90"
            >
              Delete
              {isPending && (
                <Loader2 className="ml-2 size-4 animate-spin" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

// ——— Main component ———
const WorkspaceSettingsClient = ({
  workspace,
  userRole,
  members,
  invitations,
  currentUserId,
}: WorkspaceSettingsClientProps) => {
  const TypeIcon = workspace.type === "personal" ? Home : Users;

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="h1 text-dark-100">Workspace Settings</h1>
        <div className="mt-2 flex items-center gap-3">
          <TypeIcon
            className={cn(
              "size-5",
              workspace.type === "personal" ? "text-brand" : "text-blue",
            )}
          />
          <span className="body-1 text-light-100">{workspace.name}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
              roleBadgeStyles[userRole],
            )}
          >
            {userRole}
          </span>
        </div>
      </motion.div>

      <Separator className="bg-light-300" />

      {/* Section 1: General (owner only) */}
      {userRole === "owner" && (
        <>
          <GeneralSection workspace={workspace} />
          <Separator className="bg-light-300" />
        </>
      )}

      {/* Section 2: Members */}
      <MembersSection
        workspace={workspace}
        userRole={userRole}
        members={members}
        currentUserId={currentUserId}
      />

      <Separator className="bg-light-300" />

      {/* Section 3: Invite Link (owner/admin) */}
      {(userRole === "owner" || userRole === "admin") && (
        <>
          <InviteLinkSection
            workspace={workspace}
            userRole={userRole}
            invitations={invitations}
          />
          <Separator className="bg-light-300" />
        </>
      )}

      {/* Section 4: Danger Zone (owner only) */}
      {userRole === "owner" && workspace.type !== "personal" && (
        <DangerZoneSection
          workspace={workspace}
          members={members}
          currentUserId={currentUserId}
        />
      )}
    </motion.div>
  );
};

export default WorkspaceSettingsClient;
