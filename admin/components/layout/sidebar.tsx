// src/components/layout/sidebar.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
      <div className="flex flex-col gap-2 h-full">
        <div className="flex h-14 items-center border-b px-4">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="text-xl font-bold">Investment Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <SidebarNav />
        </div>
      </div>
    </div>
  );
}

