// app/admin/layout.tsx
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { isAuthenticated, getUser } from "@/lib/auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Check authentication and role
  if (typeof window !== "undefined") {
    if (!isAuthenticated()) {
      redirect("/login");
    }

    const user = getUser();
    if (!user?.is_admin) {
      redirect("/user/dashboard");
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
