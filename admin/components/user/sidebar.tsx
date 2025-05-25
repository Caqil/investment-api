// components/user/sidebar.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  User,
  CreditCard,
  Wallet,
  FileCheck,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

interface UserSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function UserSidebar({ open, onClose }: UserSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/user/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/user/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "Deposit",
      href: "/user/deposit",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Withdraw",
      href: "/user/withdraw",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      title: "KYC Verification",
      href: "/user/kyc",
      icon: <FileCheck className="h-5 w-5" />,
    },
    {
      title: "Tasks",
      href: "/user/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      title: "Referrals",
      href: "/user/referrals",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Transactions",
      href: "/user/transactions",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/user/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const SidebarContent = (
    <>
      <div className="flex items-center px-4 py-6">
        <Link href="/user/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">Investment App</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-primary",
                pathname === item.href || pathname?.startsWith(`${item.href}/`)
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  );

  // For mobile: render in a Sheet
  if (typeof window !== "undefined" && window.innerWidth < 1024) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-72">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // For desktop: render as a fixed sidebar
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 border-r bg-background h-[calc(100vh-60px)]">
      {SidebarContent}
    </div>
  );
}
