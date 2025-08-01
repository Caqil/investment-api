// app/user/layout.tsx
import { UserShell } from "@/components/layout/user/user-shell";
import { isAuthenticated, getUser } from "@/lib/auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { redirect } from "next/navigation";

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  // Check authentication and role
  if (typeof window !== "undefined") {
    if (!isAuthenticated()) {
      redirect("/login");
    }

    const user = getUser();
    if (user?.is_admin) {
      redirect("/admin/dashboard");
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserShell>{children}</UserShell>
    </ThemeProvider>
  );
}
