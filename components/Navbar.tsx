"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { navItems } from "@/constants";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const pathname = usePathname();
  const quickLinks = useMemo(() => navItems.slice(0, 3), []);

  return (
    <div
      className={cn(
        "fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2"
      )}
    >
      <div className="flex items-center justify-between gap-4 rounded-full border border-light-300 bg-white/80 px-4 py-3 shadow-drop-1 backdrop-blur">
        <Link href="/">
          <Image
            src="/assets/icons/logo_brand.png"
            alt="Storey"
            width={150}
            height={150}
            loading="eager"
          />
        </Link>

        <Show when="signed-in">
          <nav className="hidden items-center gap-4 md:flex">
            {quickLinks.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className={cn(
                  "text-[14px] font-medium text-light-100 transition-colors hover:text-brand",
                  pathname === item.url && "text-brand"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </Show>

        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton>
              <button
                type="button"
                className="primary-btn px-4 py-2 text-white"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button
                type="button"
                className="rounded-full border border-brand px-4 py-2 text-[14px] leading-5 font-medium text-brand transition-all hover:bg-brand/10"
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/"
              className="hidden rounded-full border border-light-300 px-3 py-2 text-[12px] font-semibold text-light-100 transition-all hover:border-brand hover:text-brand sm:inline-flex"
            >
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
