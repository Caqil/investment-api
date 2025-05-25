// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  // Redirect to dashboard if authenticated, otherwise to login
  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}
