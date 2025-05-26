"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { LogOut, Bell, Moon, Sun } from "lucide-react";
import {
  Home,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  Users,
  CheckSquare,
  Package,
  Settings,
} from "lucide-react";
import { userApi } from "@/lib/user-api";
import { User } from "@/types/auth";
import { getUser, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface SidebarProps {
  className?: string;
}

export function UserSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const response = await userApi.notifications.getUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.unread_count);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Get user data
  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Investment Platform
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profile_pic_url} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user?.name || "User"}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {user?.email || "user@example.com"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-3">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
            Main
          </h2>
          <div className="space-y-1">
            <NavItem
              href="/user/dashboard"
              icon={<Home size={16} />}
              label="Dashboard"
              pathname={pathname}
            />
            <NavItem
              href="/user/transactions"
              icon={<CreditCard size={16} />}
              label="Transactions"
              pathname={pathname}
            />
            <NavItem
              href="/user/notifications"
              icon={<Bell size={16} />}
              label="Notifications"
              pathname={pathname}
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
          </div>
        </div>

        <div className="px-3">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
            Finance
          </h2>
          <div className="space-y-1">
            <NavItem
              href="/user/deposits"
              icon={<ArrowDownLeft size={16} />}
              label="Deposits"
              pathname={pathname}
            />
            <NavItem
              href="/user/withdrawals"
              icon={<ArrowUpRight size={16} />}
              label="Withdrawals"
              pathname={pathname}
            />
            <NavItem
              href="/user/plans"
              icon={<Package size={16} />}
              label="Investment Plans"
              pathname={pathname}
            />
          </div>
        </div>

        <div className="px-3">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
            Other
          </h2>
          <div className="space-y-1">
            <NavItem
              href="/user/kyc"
              icon={<UserCheck size={16} />}
              label="KYC Verification"
              pathname={pathname}
            />
            <NavItem
              href="/user/tasks"
              icon={<CheckSquare size={16} />}
              label="Tasks"
              pathname={pathname}
            />
            <NavItem
              href="/user/referrals"
              icon={<Users size={16} />}
              label="Referrals"
              pathname={pathname}
            />
            <NavItem
              href="/user/profile"
              icon={<Settings size={16} />}
              label="Profile Settings"
              pathname={pathname}
            />
          </div>
        </div>

        <div className="px-3 pt-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  badge?: number;
}

function NavItem({ href, icon, label, pathname, badge }: NavItemProps) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "transparent"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <Badge variant="secondary" className="ml-auto h-5 px-2 py-0 text-xs">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </Link>
  );
}
