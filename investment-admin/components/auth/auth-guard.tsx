// components/auth/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isAuthenticated, getUser } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  const isPublicPath = PUBLIC_PATHS.includes(pathname || "");

  useEffect(() => {
    // Skip for public paths - they don't need auth
    if (isPublicPath) {
      setIsCheckingAuth(false);
      setShouldRender(true);
      return;
    }

    // Check authentication status
    const authStatus = isAuthenticated();

    if (!authStatus) {
      // Redirect to login
      router.push("/login");
    } else {
      setShouldRender(true);
    }

    setIsCheckingAuth(false);
  }, [isPublicPath, pathname, router]);

  // Handle redirecting already logged-in users from public paths
  useEffect(() => {
    if (isPublicPath && user && !loading) {
      // Updated: Redirect to appropriate dashboard based on user role
      const redirectPath = user.is_admin
        ? "/admin/dashboard"
        : "/user/dashboard";
      router.push(redirectPath);
    }
  }, [isPublicPath, user, loading, router]);

  // Show loading state while checking authentication
  if (isCheckingAuth || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If on a public path and redirecting, show loading
  if (isPublicPath && user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if we've completed auth checks and should render
  return shouldRender ? <>{children}</> : null;
}
