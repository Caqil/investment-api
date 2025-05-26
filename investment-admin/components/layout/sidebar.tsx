"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  FileCheck,
  Home,
  ListChecks,
  LogOut,
  Settings,
  UserCheck,
  Users,
  X,
  Bell,
  BarChart3,
  Shield,
  NewspaperIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/providers/auth-provider";
import { News_Cycle } from "next/font/google";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const items = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Users", href: "/users", icon: Users },
  { name: "Plans", href: "/plans", icon: CreditCard },
  { name: "Payments", href: "/payments", icon: BarChart3 },
  { name: "Withdrawals", href: "/withdrawals", icon: CreditCard },
  { name: "KYC Verification", href: "/kyc", icon: Shield },
  { name: "Tasks", href: "/tasks", icon: ListChecks },
  { name: "News", href: "/news", icon: NewspaperIcon },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const links = (
    <div className="space-y-1 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
            onClick={() => onOpenChange(false)}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 border-r">
          <div className="flex h-16 items-center border-b px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
                <span className="text-primary-foreground font-bold">IA</span>
              </div>
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="px-2 py-2">{links}</div>
            <div className="px-2 py-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                onClick={logout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Log out
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden h-screen w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
              <span className="text-primary-foreground font-bold">IA</span>
            </div>
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2 py-2">{links}</div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </Button>
        </div>
      </div>
    </>
  );
}
