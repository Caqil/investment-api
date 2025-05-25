// app/user/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { UserHeader } from "@/components/user/header";
import { UserSidebar } from "@/components/user/sidebar";
import { Footer } from "@/components/layout/footer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not logged in or is admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (isAdmin) {
        router.push("/admin/dashboard");
      }
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <UserHeader onMenuButtonClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1">
        <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
