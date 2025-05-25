// providers/auth-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import { api } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, deviceId: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    token: string,
    password: string
  ) => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Get user data from localStorage
        const userData = localStorage.getItem("user_data");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAdmin(!!parsedUser.is_admin);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Clear potentially corrupted data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, deviceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        device_id: deviceId,
      });

      // Store auth token
      const token = response.data.token;
      localStorage.setItem("auth_token", token);

      // Store user data
      const userData = response.data.user;
      localStorage.setItem("user_data", JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAdmin(!!userData.is_admin);

      // Set cookies for middleware
      document.cookie = `auth_token=${token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`;
      document.cookie = `user_is_admin=${
        userData.is_admin ? "true" : "false"
      }; path=/; max-age=${60 * 60 * 24 * 7}`;

      // Redirect based on role
      if (userData.is_admin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");

    // Clear cookies
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "user_is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    // Reset state
    setUser(null);
    setIsAdmin(false);

    // Redirect to login
    router.push("/login");
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/register", userData);
      router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.error || "Registration failed. Please try again."
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/verify-email", { email, code });
      router.push("/login");
    } catch (error: any) {
      console.error("Email verification error:", error);
      setError(
        error.response?.data?.error || "Verification failed. Please try again."
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", { email });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setError(
        error.response?.data?.error ||
          "Failed to send reset link. Please try again."
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    token: string,
    password: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/reset-password", {
        email,
        token,
        new_password: password,
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(
        error.response?.data?.error ||
          "Password reset failed. Please try again."
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user_data", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAdmin,
    isLoading,
    error,
    login,
    logout,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
