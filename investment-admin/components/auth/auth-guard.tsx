// src/components/auth/auth-guard.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname || "");

  useEffect(() => {
    if (!loading) {
      // If not authenticated and not on a public path, redirect to login
      if (!isAuthenticated && !isPublicPath) {
        router.push("/login");
      }

      // If authenticated and on a public path, redirect to dashboard
      if (isAuthenticated && isPublicPath) {
        router.push("/dashboard");
      }
    }
  }, [loading, isAuthenticated, router, isPublicPath]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is on a page they're allowed to see, render children
  if (
    (isAuthenticated && !isPublicPath) ||
    (!isAuthenticated && isPublicPath)
  ) {
    return <>{children}</>;
  }

  // This is an intermediate state while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
