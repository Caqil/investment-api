import React from "react";
import Link from "next/link";
import { UserNav } from "./user-nav";
import { Button } from "../ui/button";
import { Menu, Bell, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { Badge } from "../ui/badge";
import { ModeToggle } from "../mode-toggle";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[280px] p-0">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="font-bold">Investment Admin</span>
            </Link>
          </div>
          <div className="px-2 py-6">
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-2">
        {/* Notifications button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        {/* Settings button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
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
