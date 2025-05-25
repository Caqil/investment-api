// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Investment App Admin",
  description: "Login to the Investment App Admin Dashboard",
};

export default function LoginPage() {
  return <LoginForm />;
}
