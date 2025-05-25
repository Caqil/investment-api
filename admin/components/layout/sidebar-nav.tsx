
// src/components/layout/sidebar-nav.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileCheck,
  Layers,
  CheckSquare,
  BarChart3,
  Bell,
} from "lucide-react";
import { cn } from "../../lib/utils";

const items = [
  {
    title: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Withdrawals",
    href: "/withdrawals",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    title: "KYC Verification",
    href: "/kyc",
    icon: <FileCheck className="h-5 w-5" />,
  },
  {
    title: "Plans",
    href: "/plans",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 gap-2">
      {items.map((item, index) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}