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
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Withdrawals",
    href: "/dashboard/withdrawals",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    title: "KYC Verification",
    href: "/dashboard/kyc",
    icon: <FileCheck className="h-5 w-5" />,
  },
  {
    title: "Plans",
    href: "/dashboard/plans",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item, index) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-primary",
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
