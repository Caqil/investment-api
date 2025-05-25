"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "../../components/layout/footer";
import { Sidebar } from "../../components/layout/sidebar";
import { Header } from "../../components/layout/header";
import { useAuthStore } from "../../store/auth-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  // Initialize auth state on component mount
  useEffect(() => {
    initialize();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [initialize, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
