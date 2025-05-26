"use client";

import { UserSidebar } from "@/components/layout/user/user-sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

interface UserShellProps {
  children: React.ReactNode;
  className?: string;
}

export function UserShell({ children, className }: UserShellProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // Function to update isMobile state based on window width
  const updateIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // Check window width on mount and add resize listener
  useEffect(() => {
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r">
        <UserSidebar />
      </aside>

      {/* Mobile sidebar with drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b flex items-center h-14 px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu size={20} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <UserSidebar />
          </SheetContent>
        </Sheet>

        <div className="font-semibold">{getPageTitle(pathname)}</div>
      </div>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 overflow-hidden",
          isMobile ? "pt-14" : "pt-0",
          className
        )}
      >
        {/* Page title bar (desktop only) */}
        <div className="hidden md:flex h-14 items-center gap-4 border-b bg-background px-6">
          <div className="font-semibold">{getPageTitle(pathname)}</div>
        </div>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

// Helper function to get the page title from the pathname
function getPageTitle(pathname: string): string {
  const path = pathname.split("/").filter(Boolean);

  // If no path segments, default to Dashboard
  if (path.length === 0 || (path.length === 1 && path[0] === "user")) {
    return "Dashboard";
  }

  // Get the last segment of the path (excluding user)
  const lastSegment = path[path.length - 1];

  // Capitalize the first letter and add spaces before capital letters
  return lastSegment
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}
