"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginCredentials } from "@/types/auth";
import { api } from "@/lib/api";
import { userApi } from "@/lib/user-api";
import {
  getUser,
  setUser as storeUser,
  setToken,
  logout as logoutUser,
  isAuthenticated,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => false,
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user on initial mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have user data
        const storedUser = getUser();

        if (storedUser && isAuthenticated()) {
          console.log("Found authenticated user", storedUser.id);
          setUser(storedUser);

          // Optionally refresh user data from API
          try {
            if (!storedUser.is_admin) {
              // For regular users, fetch profile data
              const profileResponse = await userApi.profile.getProfile();
              if (profileResponse.data?.user) {
                console.log("Updated user data from API");
                setUser(profileResponse.data.user);
                storeUser(profileResponse.data.user);
              }
            } else {
              // For admin users, we could fetch admin profile
              // This would depend on your API structure
            }
          } catch (refreshError) {
            console.error("Error refreshing user data:", refreshError);
            // Non-critical error, we continue with stored user
          }
        } else {
          console.log("No authenticated user found");
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Failed to initialize authentication");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login for", credentials.email);
      const response = await api.auth.login(credentials);

      if (response.error) {
        setError(response.error);
        return false;
      }

      if (response.data) {
        const { token, user } = response.data;

        // Store token and user data
        console.log("Login successful, storing token and user data");
        setToken(token);
        storeUser(user);
        setUser(user);

        return true;
      }

      setError("Login failed. Please try again.");
      return false;
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out user");
    logoutUser();
    setUser(null);
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (user.is_admin) {
        // Admin profile endpoint would go here
        console.log("Refreshing admin user");
      } else {
        console.log("Refreshing regular user");
        const response = await userApi.profile.getProfile();
        if (response.data?.user) {
          setUser(response.data.user);
          storeUser(response.data.user);
        }
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
