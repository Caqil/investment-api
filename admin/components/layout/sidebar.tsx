import React from "react";
import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

export function Sidebar() {
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="hidden lg:flex flex-col h-screen border-r bg-background">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link
          className="flex items-center gap-2 font-semibold"
          href="/dashboard"
        >
          <span className="text-xl font-bold">Investment Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6 px-4">
        <SidebarNav />
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
