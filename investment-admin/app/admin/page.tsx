
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, isAuthenticated } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get user data and check if admin
    const user = getUser();

    if (user?.is_admin) {
      // If admin, redirect to admin dashboard
      router.push("/admin/dashboard");
    } else {
      // If not admin, redirect to user dashboard
      router.push("/user/dashboard");
    }
  }, [router]);

  // Show loading indicator while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
