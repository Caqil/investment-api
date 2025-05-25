// components/admin/header.tsx
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, Bell, Settings } from "lucide-react";
import { UserNav } from "../layout/user-nav";

interface AdminHeaderProps {
  onMenuButtonClick?: () => void;
}

export function AdminHeader({ onMenuButtonClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={onMenuButtonClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Title - visible on desktop */}
      <div className="hidden lg:block">
        <Link href="/admin/dashboard" className="text-lg font-semibold">
          Admin Dashboard
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Header actions */}
      <div className="flex items-center gap-2">
        {/* Notifications button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        {/* Settings button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Link>
        </Button>

        {/* Theme toggle */}
        <ModeToggle />

        {/* User dropdown */}
        <UserNav />
      </div>
    </header>
  );
}
