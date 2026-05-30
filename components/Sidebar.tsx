"use client";

import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Clapperboard,
  Ellipsis,
  FileText,
  ImageIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Images", href: "/images", icon: ImageIcon },
  { name: "AI Collections", href: "/ai-collections", icon: BrainCircuit },
  { name: "Media", href: "/media", icon: Clapperboard },
  { name: "Others", href: "/others", icon: Ellipsis },
];

interface SidebarProps {
  fullName: string;
  avatar: string;
}

const Sidebar = ({ fullName, avatar }: SidebarProps) => {
  const pathname = usePathname();
  const avatarUrl = avatar || "/assets/images/avatar.png";

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  // Prevent hydration mismatch by using isMounted check
  const displayCollapsed = isMounted ? isCollapsed : false;

  return (
    <aside
      className={cn(
        "sidebar transition-all duration-300 ease-in-out flex flex-col justify-between h-screen shrink-0",
        displayCollapsed
          ? "w-20 sm:w-20 lg:w-20 xl:w-20 px-3 py-7"
          : "w-22.5 sm:w-22.5 lg:w-70 xl:w-81.25 px-5 py-7",
      )}
    >
      <div>
        <div
          className={cn(
            "flex items-center justify-between mb-8",
            displayCollapsed ? "flex-col gap-4" : "flex-row",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "relative flex items-center h-10 w-full overflow-hidden",
              displayCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <div
              className={cn(
                "transition-all duration-300 ease-in-out origin-left shrink-0",
                displayCollapsed
                  ? "opacity-0 scale-75 -translate-x-10 pointer-events-none absolute"
                  : "opacity-100 scale-100 translate-x-0 relative",
              )}
            >
              <Image
                src="/assets/icons/logo_brand.png"
                alt="Storey"
                width={148}
                height={44}
                className="h-auto w-[148px] object-contain"
                priority
              />
            </div>
            <div
              className={cn(
                "transition-all duration-300 ease-in-out origin-left shrink-0",
                displayCollapsed
                  ? "opacity-100 scale-100 translate-x-0 relative"
                  : "opacity-0 scale-75 -translate-x-10 pointer-events-none absolute",
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
                        "bg-[#ff6b6b]/15 text-[#ff6b6b] font-dynapuff font-medium",
                      displayCollapsed
                        ? "justify-center px-2 rounded-xl"
                        : "gap-3 px-4 rounded-full",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4.5 transition-colors shrink-0",
                        isActive ? "text-brand" : "text-slate-500",
                      )}
                    />
                    <span
                      className={cn(
                        "whitespace-nowrap transition-all duration-300 ease-in-out origin-left",
                        displayCollapsed
                          ? "max-w-0 opacity-0 translate-x-[-10px] pointer-events-none"
                          : "max-w-40 opacity-100 translate-x-0",
                      )}
                      style={{
                        overflow: "hidden",
                      }}
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

      <div className="flex flex-col gap-4 mt-auto">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out origin-bottom overflow-hidden",
            displayCollapsed
              ? "max-h-0 opacity-0 scale-95 pointer-events-none"
              : "max-h-60 opacity-100 scale-100",
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 cursor-pointer focus:outline-none"
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
