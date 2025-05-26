// components/auth/login-handler.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

// Generate a device ID for the user
function getOrCreateDeviceId(): string {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `web_user_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  }
  return "placeholder_device_id";
}

export function LoginHandler() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { login, error: authError, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect path from URL if available
  const redirectPath = searchParams.get("redirect") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!email || !password) {
      setFormError("Email and password are required");
      return;
    }

    try {
      // Get or create device ID
      const deviceId = getOrCreateDeviceId();

      const success = await login({
        email,
        password,
        device_id: deviceId,
      });

      if (success) {
        console.log("Login successful, redirecting");

        // Get current user from auth context
        const userData = localStorage.getItem("auth_user");
        if (userData) {
          const user = JSON.parse(userData);

          // Redirect based on user role
          if (redirectPath) {
            // If there was a specific redirect request, honor it
            router.push(redirectPath);
          } else {
            // Otherwise redirect based on role
            router.push(user.is_admin ? "/dashboard" : "/user/dashboard");
          }
        } else {
          // Fallback if user data isn't available
          router.push("/user/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormError("An unexpected error occurred");
    }
  };

  // Combined error from form validation or auth process
  const errorMessage = formError || authError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            disabled={loading}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
