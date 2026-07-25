"use client";

import { useState, useTransition } from "react";
import { getWorkspaceActivity } from "@/lib/actions/activity.actions";
import FormattedDateTime from "@/components/FormattedDateTime";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityFeedProps {
  workspaceId: string;
  initialItems: ActivityLogItem[];
  initialCursor: { createdAt: string; id: string } | null;
}

/**
 * Produces a human-readable description for each activity log entry.
 * Uses actor snapshot (actorName/actorEmail from metadata) as the source
 * of truth for who performed the action, as required by spec.
 * Falls back to raw action string for unrecognized actions (forward-compat).
 */
function formatAction(item: ActivityLogItem): string {
  const m = item.metadata ?? {};
  const actor =
    (m.actorName as string | null) || (m.actorEmail as string) || "Someone";

  switch (item.action) {
    case "file.upload":
      return `${actor} uploaded ${m.fileName ?? "a file"}`;

    case "file.rename":
      return `${actor} renamed "${m.oldName ?? "a file"}" to "${m.newName ?? "unknown"}"`;

    case "file.delete":
      if (m.reason === "auto_purge_30_days") {
        return `${m.fileName ?? "A file"} was automatically deleted after 30 days in trash`;
      }
      return `${actor} permanently deleted ${m.fileName ?? "a file"}`;

    case "file.trash":
      return `${actor} moved ${m.fileName ?? "a file"} to trash`;

    case "file.restore":
      return `${actor} restored ${m.fileName ?? "a file"} from trash`;

    case "file.share.create":
      return `${actor} shared "${m.fileName ?? "a file"}" with ${m.email ?? "someone"}`;

    case "file.share.remove":
      return `${actor} removed ${m.email ?? "someone"} from "${m.fileName ?? "a file"}"`;

    case "workspace.create":
      return `${actor} created the workspace "${m.name ?? "this workspace"}"`;

    case "workspace.rename":
      return `${actor} renamed workspace from "${m.oldName ?? "?"}" to "${m.newName ?? "?"}"`;

    case "workspace.appearance.update":
      return `${actor} updated workspace appearance`;

    case "workspace.delete":
      return `${actor} deleted workspace "${m.name ?? "this workspace"}"`;

    case "workspace.member.invite":
      return `${actor} created a${m.role ? ` ${m.role}` : ""} invite link`;

    case "workspace.member.join":
      return `${actor} joined the workspace as ${m.role ?? "a member"}`;

    case "workspace.member.remove":
      return `${actor} removed ${(m.removedUserName as string | null) || (m.removedUserEmail as string) || "a member"} from the workspace`;

    case "workspace.member.leave":
      return `${actor} left the workspace`;

    case "workspace.member.role_change":
      return `${actor} changed ${(m.targetUserName as string | null) || (m.targetUserEmail as string) || "a member"}'s role from ${m.oldRole ?? "?"} to ${m.newRole ?? "?"}`;

    case "workspace.member.ownership_transfer":
      return `${actor} transferred ownership to ${(m.newOwnerName as string | null) || (m.newOwnerEmail as string) || "a member"}`;

    case "file.share.create":
      return `${actor} shared "${m.fileName ?? "a file"}" with ${m.email ?? "someone"}`;

    case "file.share.remove":
      return `${actor} removed ${m.email ?? "someone"} from "${m.fileName ?? "a file"}"`;

    case "workspace.create":
      return `${actor} created the workspace "${m.name ?? "this workspace"}"`;

    case "workspace.rename":
      return `${actor} renamed workspace from "${m.oldName ?? "?"}" to "${m.newName ?? "?"}"`;

    case "workspace.appearance.update":
      return `${actor} updated workspace appearance`;

    case "workspace.delete":
      return `${actor} deleted workspace "${m.name ?? "this workspace"}"`;

    case "workspace.member.invite":
      return `${actor} created a${m.role ? ` ${m.role}` : ""} invite link`;

    case "workspace.member.join":
      return `${actor} joined the workspace as ${m.role ?? "a member"}`;

    case "workspace.member.remove":
      return `${actor} removed ${(m.removedUserName as string | null) || (m.removedUserEmail as string) || "a member"} from the workspace`;

    case "workspace.member.leave":
      return `${actor} left the workspace`;

    case "workspace.member.role_change":
      return `${actor} changed ${(m.targetUserName as string | null) || (m.targetUserEmail as string) || "a member"}'s role from ${m.oldRole ?? "?"} to ${m.newRole ?? "?"}`;

    case "workspace.member.ownership_transfer":
      return `${actor} transferred ownership to ${(m.newOwnerName as string | null) || (m.newOwnerEmail as string) || "a member"}`;

    default:
      return item.action;
  }
}

function getActionColorClass(action: string): string {
  if (
    action === "file.delete" ||
    action === "file.trash" ||
    action === "file.share.remove" ||
    action === "workspace.delete" ||
    action === "workspace.member.remove" ||
    action === "workspace.member.leave"
  ) {
    return "bg-red/80";
  }

  if (
    action === "file.upload" ||
    action === "file.restore" ||
    action === "workspace.create" ||
    action === "workspace.member.join" ||
    action === "workspace.member.invite" ||
    action === "file.share.create"
  ) {
    return "bg-green/80";
  }

  if (
    action === "file.rename" ||
    action === "workspace.rename" ||
    action === "workspace.appearance.update" ||
    action === "workspace.member.role_change" ||
    action === "workspace.member.ownership_transfer"
  ) {
    return "bg-orange/80";
  }

  return "bg-brand/80";
}

export default function ActivityFeed({
  workspaceId,
  initialItems,
  initialCursor,
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityLogItem[]>(initialItems);
  const [cursor, setCursor] = useState<{
    createdAt: string;
    id: string;
  } | null>(initialCursor);
  const [category, setCategory] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (newCategory: string) => {
    if (newCategory === category) return;
    setCategory(newCategory);
    setError(null);
    startTransition(async () => {
      try {
        const result = await getWorkspaceActivity(
          workspaceId,
          undefined,
          5,
          newCategory,
        );
        if (result) {
          setItems(result.items as ActivityLogItem[]);
          setCursor(
            result.nextCursor as { createdAt: string; id: string } | null,
          );
        }
      } catch (err) {
        console.error("Failed to load activity:", err);
        setError("Failed to load activity. Please try again.");
      }
    });
  };

  const handleLoadMore = () => {
    if (!cursor) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await getWorkspaceActivity(
          workspaceId,
          cursor,
          5,
          category,
        );
        if (result) {
          setItems((prev) => [...prev, ...(result.items as ActivityLogItem[])]);
          setCursor(
            result.nextCursor as { createdAt: string; id: string } | null,
          );
        }
      } catch (err) {
        console.error("Failed to load more activity:", err);
        setError("Failed to load more activity. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "files", "members", "workspace"].map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            disabled={isPending}
            className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
              category === cat
                ? "bg-brand text-white"
                : "bg-light-300/50 text-light-100 hover:bg-light-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.length === 0 && !isPending ? (
          <p className="caption text-light-200 py-2">
            No activity found for this category
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-light-300 bg-white p-3"
            >
              {/* Dot indicator */}
              <div
                className={`mt-1.5 size-2 shrink-0 rounded-full ${getActionColorClass(item.action)}`}
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="body-2 truncate text-dark-100">
                  {formatAction(item)}
                </p>
                <FormattedDateTime
                  date={item.createdAt}
                  className="caption mt-0.5 text-light-200"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {cursor && (
        <div className="pt-2 space-y-2">
          {error && <p className="caption text-red-500 text-center">{error}</p>}
          <Button
            onClick={handleLoadMore}
            disabled={isPending}
            variant="outline"
            className="w-full h-10 rounded-xl border-light-300 text-light-100 cursor-pointer hover:bg-light-400/50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="sr-only">Loading...</span>
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
