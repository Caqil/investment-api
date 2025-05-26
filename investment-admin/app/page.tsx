// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // Get user data to determine where to redirect
      const user = getUser();

      if (user?.is_admin) {
        // If admin, redirect to admin dashboard
        router.push("/admin/dashboard");
      } else {
        // If regular user, redirect to user dashboard
        router.push("/user/dashboard");
      }
    } else {
      // If not authenticated, redirect to login
      router.push("/login");
    }

    // Set loading to false after a short delay to avoid flickering
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      {isLoading && (
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      )}
    </div>
  );
}
