// src/components/auth/login-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/auth-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Generate a device ID for admin dashboard
function getOrCreateDeviceId(): string {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `web_admin_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  }
  return "placeholder_device_id";
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, error: authError } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  // Set device ID on component mount
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!email || !password) {
      setFormError("Email and password are required");
      return;
    }

    setIsLoading(true);

    try {
      // Use the correct property name that matches the LoginCredentials type
      const success = await login({
        email,
        password,
        device_id: deviceId,
      });

      if (success) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const error = formError || authError;

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Investment App Admin Dashboard
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
