// admin/app/(auth)/verify-email/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { verifyEmail } from "@/lib/auth";

// Form validation schema
const verifyEmailSchema = z.object({
  code: z.string().min(4, { message: "Verification code is required" }),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Get email from URL params
  useEffect(() => {
    const emailParam = searchParams?.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Initialize form
  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: "",
    },
  });

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (values: VerifyEmailFormValues) => {
    if (isSubmitting || !email) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await verifyEmail({
        email,
        code: values.code,
      });

      // Show success message
      setSuccess(true);

      // Redirect to login page after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(
        error.message ||
          "Failed to verify email. Please check your code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return;

    setError(null);

    try {
      // Here you would call your API to resend the verification code
      // For now, we'll just show a message and start the cooldown
      // await resendVerificationCode(email);

      // Start cooldown timer (60 seconds)
      setResendCooldown(60);

      // Show success message
      setError("A new verification code has been sent to your email.");
    } catch (error: any) {
      console.error("Resend error:", error);
      setError(
        error.message ||
          "Failed to resend verification code. Please try again later."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/login"
          className="text-sm flex items-center text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
        <Mail className="w-8 h-8 text-primary" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Verify Your Email</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We've sent a verification code to {email || "your email"}
        </p>
      </div>

      {error && (
        <Alert variant={error.includes("sent") ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {error.includes("sent") ? "Code Sent" : "Error"}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Your email has been verified successfully! Redirecting to login...
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter 6-digit code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          Didn't receive a code?{" "}
          <button
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            className={`text-primary hover:underline ${
              resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Resend Code
            {resendCooldown > 0 && ` (${resendCooldown}s)`}
          </button>
        </p>
      </div>
    </div>
  );
}
