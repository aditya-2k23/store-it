"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveWorkspace } from "@/lib/actions/workspace.actions";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Home,
  Users,
  Check,
  Plus,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceWithRole[];
  activeWorkspaceId: string;
  isCollapsed: boolean;
}

const roleBadgeStyles: Record<WorkspaceRole, string> = {
  owner: "bg-brand/10 text-brand",
  admin: "bg-blue/10 text-blue",
  editor: "bg-green/10 text-green",
  viewer: "bg-light-300 text-light-100",
};

const WorkspaceSwitcher = ({
  workspaces,
  activeWorkspaceId,
  isCollapsed,
}: WorkspaceSwitcherProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const TypeIcon = activeWorkspace?.type === "personal" ? Home : Users;

  const handleSwitch = (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return;
    setSwitchingId(workspaceId);
    startTransition(async () => {
      try {
        await setActiveWorkspace(workspaceId);
        router.refresh();
      } catch {
        toast({
          description: (
            <p className="body-2 text-white">
              Failed to switch workspace. Please try again.
            </p>
          ),
          className: "error-toast",
        });
      } finally {
        setSwitchingId(null);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "shad-no-focus w-full rounded-xl border border-light-300 bg-white transition-all hover:border-light-200 hover:shadow-drop-3 cursor-pointer",
            isCollapsed
              ? "flex-center size-11"
              : "flex items-center justify-between px-3 py-2.5",
          )}
          disabled={isPending}
        >
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon
              className={cn(
                "size-4 shrink-0",
                activeWorkspace?.type === "personal"
                  ? "text-brand"
                  : "text-blue",
              )}
            />
            {!isCollapsed && (
              <span className="truncate text-sm font-semibold text-light-100">
                {activeWorkspace?.name || "Workspace"}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown className="size-4 shrink-0 text-light-200" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-64 rounded-xl border border-light-300 bg-white p-1.5 shadow-drop-1"
      >
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {workspaces.map((workspace) => {
            const Icon = workspace.type === "personal" ? Home : Users;
            const isActive = workspace.id === activeWorkspaceId;
            const isSwitching = switchingId === workspace.id;

            return (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSwitch(workspace.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                  isActive && "bg-brand/5",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    workspace.type === "personal" ? "text-brand" : "text-blue",
                  )}
                />
                <span className="flex-1 truncate text-sm font-medium text-light-100">
                  {workspace.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    roleBadgeStyles[workspace.role],
                  )}
                >
                  {workspace.role}
                </span>
                {isSwitching ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-brand" />
                ) : isActive ? (
                  <Check className="size-3.5 shrink-0 text-brand" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-light-300" />

        <DropdownMenuItem asChild>
          <Link
            href="/workspaces/new"
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-light-100 transition-colors hover:text-brand"
          >
            <Plus className="size-4 text-brand" />
            New workspace
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/workspaces"
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-light-100 transition-colors hover:text-brand"
          >
            <LayoutGrid className="size-4 text-light-200" />
            All workspaces
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;
