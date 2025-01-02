import Image from "next/image";
import Link from "next/link";
import React from "react";

const Sidebar = () => {
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

        <nav className="sidebar-nav">
          <ul className="flex flex-1 flex-col gap-6"></ul>
        </nav>
      </Link>
    </aside>
  );
};

export default Sidebar;
