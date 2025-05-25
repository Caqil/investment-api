// components/user/header.tsx
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, Bell, Settings } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { UserNav } from "../layout/user-nav";

interface UserHeaderProps {
  onMenuButtonClick?: () => void;
}

export function UserHeader({ onMenuButtonClick }: UserHeaderProps) {
  const { user } = useAuth();

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

      {/* Balance display - always visible */}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Balance</span>
        <span className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "BDT",
          }).format(user?.balance || 0)}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Header actions */}
      <div className="flex items-center gap-2">
        {/* Notifications indicator */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              2
            </Badge>
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        {/* Settings button */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/user/settings">
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
