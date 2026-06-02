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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Images", href: "/images", icon: ImageIcon },
  { name: "AI Collections", href: "/ai-collections", icon: BrainCircuit },
  { name: "Media", href: "/media", icon: Clapperboard },
  { name: "Others", href: "/others", icon: Ellipsis },
];

const STORAGE_EVENT = "sidebar-collapsed-change";

const Sidebar = () => {
  const pathname = usePathname();

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

    return localStorage.getItem("sidebar-collapsed") === "true";
  };

  const displayCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );

  const toggleCollapse = () => {
    const next = !displayCollapsed;
    localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
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
          <Link
            href="/dashboard"
            className={cn(
              "relative flex h-10 w-full items-center overflow-hidden",
              displayCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <div
              className={cn(
                "shrink-0 origin-left transition-all duration-300 ease-in-out",
                displayCollapsed
                  ? "pointer-events-none absolute -translate-x-10 scale-75 opacity-0"
                  : "relative translate-x-0 scale-100 opacity-100",
              )}
            >
              <Image
                src="/assets/icons/logo_brand.png"
                alt="Storey"
                width={148}
                height={148}
                loading="eager"
                priority
              />
            </div>
            <div
              className={cn(
                "shrink-0 origin-left transition-all duration-300 ease-in-out",
                displayCollapsed
                  ? "relative translate-x-0 scale-100 opacity-100"
                  : "pointer-events-none absolute -translate-x-10 scale-75 opacity-0",
              )}
            >
              <Image
                src="/assets/icons/logo-brand.svg"
                alt="Storey"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
          </Link>
        </div>

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
          <div className="rounded-3xl border border-white/70 bg-white/75 p-3">
            <Image
              src="/assets/images/files-2.png"
              alt="Storage helper visual"
              width={320}
              height={210}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>

        <div
          className={cn(
            "flex w-full",
            displayCollapsed ? "justify-center" : "justify-end",
          )}
        >
          <button
            onClick={toggleCollapse}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 focus:outline-none"
            aria-label={
              displayCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {displayCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
