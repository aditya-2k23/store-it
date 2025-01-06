"use client";

import { navItems } from "@/constants";
import { generateAvatar } from "@/lib/actions/user.actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Props {
  fullName: string;
  avatar: string;
  email: string;
}

const Sidebar = ({ fullName, email }: Props) => {
  const pathname = usePathname();

  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const arrayBuffer = await generateAvatar(fullName);

        if (!arrayBuffer)
          throw new Error("Avatar generation returned undefined");

        const url = URL.createObjectURL(new Blob([arrayBuffer]));

        setAvatarUrl(url);
      } catch (error) {
        console.error("Failed to generate avatar:", error);
      }
    };

    loadAvatar();
  }, [fullName]);

  return (
    <aside className="sidebar">
      <Link href="/">
        <Image
          src="/assets/icons/logo-full-brand.svg"
          alt="logo"
          width={160}
          height={50}
        />

        <Image
          src="/assets/icons/logo-brand.svg"
          alt="logo"
          width={52}
          height={52}
          className="lg:hidden"
        />
      </Link>

      <nav className="sidebar-nav">
        <ul className="flex flex-1 flex-col gap-6">
          {navItems.map(({ url, name, icon }) => (
            <Link key={name} href={url} className="lg:w-full">
              <li
                className={cn(
                  "sidebar-nav-item",
                  pathname === url && "shad-active"
                )}
              >
                <Image
                  src={icon}
                  alt={name}
                  width={24}
                  height={24}
                  className={cn(
                    "nav-icon",
                    pathname === url && "nav-icon-active"
                  )}
                />
                <p className="hidden lg:block">{name}</p>
              </li>
            </Link>
          ))}
        </ul>
      </nav>

      <Image
        src="/assets/images/files-2.png"
        alt="logo"
        width={506}
        height={410}
        className="w-full"
      />

      <div className="sidebar-user-info">
        <Image
          src={avatarUrl || "/assets/images/avatar.png"}
          alt="Avatar"
          width={44}
          height={44}
          className="sidebar-user-avatar"
        />

        <div className="hidden lg:block">
          <p className="subtitle-2 capitalize">{fullName}</p>
          <p className="caption">{email}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
