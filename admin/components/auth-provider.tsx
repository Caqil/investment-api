"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    setIsClient(true);
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
