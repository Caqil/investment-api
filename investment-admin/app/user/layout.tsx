// app/user/layout.tsx
import { UserShell } from "@/components/layout/user/user-shell";
import { isAuthenticated } from "@/lib/auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { redirect } from "next/navigation";

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  // Note: This is client-side authentication check
  // In a production app, you should use a Server Component with proper
  // server-side authentication checks or middleware

  // This is just for illustration - in Next.js 13+ you'd use middleware
  // or server components for proper auth protection
  if (typeof window !== "undefined" && !isAuthenticated()) {
    redirect("/login");
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserShell>{children}</UserShell>
    </ThemeProvider>
  );
}
