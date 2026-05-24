"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  Clapperboard,
  Ellipsis,
  FileText,
  ImageIcon,
  LayoutGrid,
  Menu,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import FileUploader from "./FileUploader";

interface Props {
  ownerId: string;
  accountId: string;
  fullName: string;
  avatar: string;
  email: string;
}
const mobileLinks = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Images", href: "/images", icon: ImageIcon },
  { name: "AI Collections", href: "/ai-collections", icon: BrainCircuit },
  { name: "Media", href: "/media", icon: Clapperboard },
  { name: "Others", href: "/others", icon: Ellipsis },
];

const MobileNavigation = ({
  ownerId,
  accountId,
  fullName,
  avatar,
  email,
}: Props) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const avatarUrl = avatar || "/assets/images/avatar.png";

  return (
    <header className="mobile-header">
      <Image src="/assets/icons/logo_brand.png" alt="Storey" width={132} height={40} className="h-auto w-auto" priority />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-white/75 bg-white/80 text-slate-700 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="shad-sheet h-screen w-[84%] max-w-[320px] border-r border-white/70 bg-[#f4f6fa] px-4 py-6">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/75 bg-white/80 p-3">
            <Image
              src={avatarUrl}
              alt={fullName}
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-slate-800">
                {fullName}
              </p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
          </div>

          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              {mobileLinks.map(({ name, href, icon: Icon }) => {
                const isActive =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);

                return (
                  <li key={name}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "mobile-nav-item",
                        isActive && "shad-active"
                      )}
                    >
                      <Icon className="size-4.5" />
                      <p>{name}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 border-t border-white/75 pt-6">
            <FileUploader
              ownerId={ownerId}
              accountId={accountId}
              className="h-12 w-full rounded-2xl bg-linear-to-r from-[#ff6b6b] to-[#ff8e7e] px-6 text-[15px] font-semibold text-white"
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileNavigation;
