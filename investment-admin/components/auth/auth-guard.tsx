"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isPublicPath = PUBLIC_PATHS.includes(pathname || "");

  useEffect(() => {
    // Skip for public paths - they don't need auth
    if (isPublicPath) {
      setIsCheckingAuth(false);
      return;
    }

    // Check authentication status directly from localStorage
    const authStatus = isAuthenticated();

    if (!authStatus) {
      router.push("/login");
    }

    setIsCheckingAuth(false);
  }, [isPublicPath, pathname, router]);

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

  // If on a public path and already logged in, redirect to dashboard
  if (isPublicPath && user) {
    router.push("/dashboard");
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For public paths or if user is authenticated for protected paths
  return <>{children}</>;
}
