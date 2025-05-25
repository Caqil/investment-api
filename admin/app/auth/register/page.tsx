"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FingerprintIcon, ArrowLeft, Check, AlertCircle } from "lucide-react";
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
import { getDeviceId } from "@/lib/device";
import { registerUser } from "@/lib/auth";

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  phone: z.string().min(9, { message: "Please enter a valid phone number" }),
  referCode: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVirtualDevice, setIsVirtualDevice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get referral code from URL if present
  const referralCode = searchParams?.get("ref") || "";

  // Initialize form with default values
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      referCode: referralCode,
    },
  });

  // Check if device is virtual - only run once
  useEffect(() => {
    if (isInitialized) return;

    const checkDevice = async () => {
      try {
        // Try to get device ID from localStorage first
        let id = localStorage.getItem("device_id");

        if (!id) {
          // If not in localStorage, generate one
          id = await getDeviceId();
        }

        setDeviceId(id);
        setIsInitialized(true);

        // For admin panel, we don't need to block virtual devices
        setIsVirtualDevice(false);
      } catch (error) {
        console.error("Error getting device ID:", error);
        // Fallback device ID
        const fallbackId =
          "admin_" + Math.random().toString(36).substring(2, 15);
        setDeviceId(fallbackId);
        setIsInitialized(true);
      }
    };

    checkDevice();
  }, [isInitialized]);

  const onSubmit = async (values: RegisterFormValues) => {
    // Don't submit if already submitting
    if (isSubmitting) return;

    // Reset states
    setError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        device_id: deviceId,
        refer_code: values.referCode || undefined,
      });

      // Show success message
      setSuccess(true);

      // Clear form
      form.reset();

      // Redirect to verification page after a delay
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }, 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error.message ||
          "An error occurred during registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
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
        <FingerprintIcon className="w-8 h-8 text-primary" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your details to register for a new account
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Registration successful! Please check your email for verification.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Code (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter referral code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
