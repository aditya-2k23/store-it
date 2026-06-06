"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveWorkspace } from "@/lib/actions/workspace.actions";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Home, Users, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn } from "./landing/animations";

const roleBadgeStyles: Record<WorkspaceRole, string> = {
  owner: "bg-brand/10 text-brand",
  admin: "bg-blue/10 text-blue",
  editor: "bg-green/10 text-green",
  viewer: "bg-light-300 text-light-100",
};

const WorkspaceCard = ({
  workspace,
}: {
  workspace: WorkspaceWithRole;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const TypeIcon = workspace.type === "personal" ? Home : Users;
  const storagePercent =
    workspace.storageLimit > 0
      ? Math.min((workspace.storageUsed / workspace.storageLimit) * 100, 100)
      : 0;

  const handleClick = () => {
    startTransition(async () => {
      try {
        await setActiveWorkspace(workspace.id);
        router.push("/dashboard");
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">
              Failed to open workspace. Please try again.
            </p>
          ),
          className: "error-toast",
        });
      }
    });
  };

  return (
    <motion.div
      variants={fadeIn}
      onClick={handleClick}
      className={cn(
        "group cursor-pointer rounded-[20px] border border-light-300 bg-white p-6 transition-all duration-200",
        "hover:shadow-drop-2 hover:border-brand/30 hover:scale-[1.02]",
        isPending && "pointer-events-none opacity-70",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10">
          <TypeIcon
            className={cn(
              "size-7",
              workspace.type === "personal" ? "text-brand" : "text-blue",
            )}
          />
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
            roleBadgeStyles[workspace.role],
          )}
        >
          {workspace.role}
        </span>
      </div>

      <h4 className="h4 mt-4 mb-1 truncate text-dark-100">
        {workspace.name}
      </h4>
      <p className="caption text-light-200">
        {workspace.memberCount ?? 1} {(workspace.memberCount ?? 1) === 1 ? "member" : "members"}
      </p>

      {/* Storage progress bar */}
      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-light-300">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin text-brand" />
        ) : (
          <ArrowRight className="size-3.5 text-brand transition-transform group-hover:translate-x-0.5" />
        )}
        <span className="caption font-semibold text-brand">
          {isPending ? "Opening…" : "Open workspace"}
        </span>
      </div>
    </motion.div>
  );
};

export default WorkspaceCard;
