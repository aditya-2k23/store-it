"use client";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Clapperboard,
  Ellipsis,
  FileText,
  ImageIcon,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarLinks = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
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

  return (
    <aside className="sidebar">
      <div>
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/assets/icons/logo_brand.png"
            alt="Storey"
            width={148}
            height={44}
            className="h-auto w-auto"
            priority
          />
        </Link>

        <nav className="mt-8" aria-label="Primary navigation">
          <ul className="flex flex-col gap-2">
            {sidebarLinks.map(({ name, href, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <li key={name}>
                  <Link
                    href={href}
                    className={cn(
                      "group flex items-center gap-3 rounded-full px-4 py-3 text-[15px] font-medium text-slate-600 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35",
                      isActive &&
                      "bg-[#ff6b6b]/15 text-[#ff6b6b]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4.5 transition-colors",
                        isActive ? "text-[#ff6b6b]" : "text-slate-500"
                      )}
                    />
                    <span>{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/75">
        <div className="overflow-hidden p-3">
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
    </aside>
  );
};

export default Sidebar;
