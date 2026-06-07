"use client";

import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Ellipsis,
  FileText,
  ImageIcon,
  LayoutGrid,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, useEffect } from "react";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.error(`Failed to get item ${key} from localStorage:`, e);
    }
    return null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error(`Failed to set item ${key} to localStorage:`, e);
    }
  }
};

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Images", href: "/images", icon: ImageIcon },
  { name: "AI Collections", href: "/ai-collections", icon: BrainCircuit },
  { name: "Media", href: "/media", icon: Clapperboard },
  { name: "Others", href: "/others", icon: Ellipsis },
];

const STORAGE_EVENT = "sidebar-collapsed-change";

interface SidebarProps {
  workspaces: WorkspaceWithRole[];
  activeWorkspaceId: string;
}

const Sidebar = ({ workspaces, activeWorkspaceId }: SidebarProps) => {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const userRole = activeWorkspace?.role;
  const pathname = usePathname();

  useEffect(() => {
    if (activeWorkspaceId) {
      safeLocalStorage.setItem("storey_previous_workspace", activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const subscribe = (callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener(STORAGE_EVENT, callback);

    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(STORAGE_EVENT, callback);
    };
  };

  const getSnapshot = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return safeLocalStorage.getItem("sidebar-collapsed") === "true";
  };

  const displayCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );

  const toggleCollapse = () => {
    const next = !displayCollapsed;
    safeLocalStorage.setItem("sidebar-collapsed", JSON.stringify(next));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  return (
    <aside
      className={cn(
        "sidebar transition-all duration-300 ease-in-out flex h-screen shrink-0 flex-col justify-between",
        displayCollapsed
          ? "w-20 px-3 py-7 sm:w-20 lg:w-20 xl:w-20"
          : "w-22.5 px-5 py-7 sm:w-22.5 lg:w-70 xl:w-81.25",
      )}
    >
      <div>
        <div
          className={cn(
            "mb-8 flex items-center justify-between",
            displayCollapsed ? "flex-col gap-4" : "flex-row",
          )}
        >
          {/* Logo / Home Link (Visible when expanded) */}
          <Link
            href="/?ref=internal"
            className={cn(
              "relative flex h-10 items-center overflow-hidden transition-all duration-300 ease-in-out",
              displayCollapsed
                ? "w-0 opacity-0 pointer-events-none absolute"
                : "w-[148px] opacity-100",
            )}
          >
            <Image
              src="/assets/icons/logo_brand.png"
              alt="Storey"
              width={148}
              height={148}
              loading="eager"
              priority
              className="shrink-0"
            />
          </Link>

          {/* Expand/Collapse Button */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "group relative flex shrink-0 items-center justify-center transition-all focus:outline-none",
              displayCollapsed
                ? "h-10 w-10 cursor-pointer rounded-lg bg-white hover:bg-slate-50"
                : "h-8 w-8 cursor-pointer rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800",
            )}
            aria-label={
              displayCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {/* Small Logo (Visible when collapsed & NOT hovered) */}
            <Image
              src="/assets/icons/logo-brand.svg"
              alt="Storey"
              width={40}
              height={40}
              className={cn(
                "absolute h-10 w-10 object-contain transition-all duration-300",
                displayCollapsed
                  ? "opacity-100 group-hover:opacity-0 scale-100"
                  : "opacity-0 pointer-events-none scale-50",
              )}
              priority
            />
            {/* Chevron Right (Visible when collapsed & hovered) */}
            <ChevronRight
              className={cn(
                "absolute size-5 text-slate-500 transition-all duration-300",
                displayCollapsed
                  ? "opacity-0 group-hover:opacity-100 scale-100"
                  : "opacity-0 pointer-events-none scale-50",
              )}
            />
            {/* Chevron Left (Visible when expanded) */}
            <ChevronLeft
              className={cn(
                "size-4 transition-all duration-300",
                displayCollapsed
                  ? "opacity-0 pointer-events-none absolute scale-50"
                  : "opacity-100 scale-100",
              )}
            />
          </button>
        </div>

        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          isCollapsed={displayCollapsed}
        />

        <div className="my-3 border-t border-light-300" />

        <nav aria-label="Primary navigation">
          <ul className="flex flex-col gap-2">
            {sidebarLinks.map(({ name, href, icon: Icon }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);

              return (
                <li key={name}>
                  <Link
                    href={href}
                    className={cn(
                      "group flex items-center py-3 font-semibold text-slate-600 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35",
                      isActive &&
                        "bg-[#ff6b6b]/15 font-dynapuff font-medium text-[#ff6b6b]",
                      displayCollapsed
                        ? "justify-center rounded-xl px-2"
                        : "gap-3 rounded-full px-4",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4.5 shrink-0 transition-colors",
                        isActive ? "text-brand" : "text-slate-500",
                      )}
                    />
                    <span
                      className={cn(
                        "origin-left whitespace-nowrap transition-all duration-300 ease-in-out",
                        displayCollapsed
                          ? "max-w-0 -translate-x-2.5 opacity-0 pointer-events-none"
                          : "max-w-40 translate-x-0 opacity-100",
                      )}
                      style={{ overflow: "hidden" }}
                    >
                      {name}
                    </span>
                  </Link>
                </li>
              );
            })}
            {(userRole === "owner" || userRole === "admin") && (
              <li>
                <Link
                  href={`/workspaces/${activeWorkspaceId}/settings`}
                  className={cn(
                    "group flex items-center py-3 font-semibold text-slate-600 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35",
                    pathname.includes("/settings") &&
                      "bg-[#ff6b6b]/15 font-dynapuff font-medium text-[#ff6b6b]",
                    displayCollapsed
                      ? "justify-center rounded-xl px-2"
                      : "gap-3 rounded-full px-4",
                  )}
                >
                  <Settings
                    className={cn(
                      "size-4.5 shrink-0 transition-colors",
                      pathname.includes("/settings")
                        ? "text-brand"
                        : "text-slate-500",
                    )}
                  />
                  <span
                    className={cn(
                      "origin-left whitespace-nowrap transition-all duration-300 ease-in-out",
                      displayCollapsed
                        ? "max-w-0 -translate-x-2.5 opacity-0 pointer-events-none"
                        : "max-w-40 translate-x-0 opacity-100",
                    )}
                    style={{ overflow: "hidden" }}
                  >
                    Settings
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div
          className={cn(
            "origin-bottom overflow-hidden transition-all duration-300 ease-in-out",
            displayCollapsed
              ? "max-h-0 scale-95 opacity-0 pointer-events-none"
              : "max-h-60 scale-100 opacity-100",
          )}
        >
          <Image
            src="/assets/images/files-2.png"
            alt="Storage helper visual"
            width={250}
            height={250}
            priority
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
