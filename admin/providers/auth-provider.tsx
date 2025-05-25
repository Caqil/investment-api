// providers/auth-provider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Define the base URL for API requests
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Add device ID header if available
    const deviceId = localStorage.getItem("device_id");
    if (deviceId) {
      config.headers["X-Device-ID"] = deviceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Define User type
type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  referral_code: string;
  is_kyc_verified: boolean;
  email_verified: boolean;
  is_admin?: boolean;
  biometric_enabled: boolean;
  profile_pic_url: string;
  created_at: string;
  plan_id: number;
};

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  token: string | null;
  login: (credentials: {
    email: string;
    password: string;
    device_id: string;
  }) => Promise<User | undefined>;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Create the context with properly typed default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  token: null,
  login: async () => undefined,
  register: async () => ({ success: false, message: "" }),
  logout: () => {},
  updateUser: () => {},
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.is_admin || false;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);

          // Fetch current user data from API
          try {
            const response = await api.get("/user/profile");
            if (response.data && response.data.user) {
              setUser(response.data.user);
            }
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
            // Clear invalid token
            localStorage.removeItem("token");
            setToken(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid token
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);
  const generateDeviceId = () => {
    const deviceId = "web_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("device_id", deviceId);
    return deviceId;
  };

  const login = async (credentials: {
    email: string;
    password: string;
    device_id: string;
  }) => {
    setIsLoading(true);
    try {
      // Try login first
      try {
        const deviceId =
          localStorage.getItem("device_id") || generateDeviceId();
        const response = await api.post("/auth/login", credentials);

        if (response.data && response.data.token && response.data.user) {
          const receivedToken = response.data.token;
          const userData = response.data.user;

          // Save to localStorage
          localStorage.setItem("token", receivedToken);
          localStorage.setItem("device_id", credentials.device_id);

          setToken(receivedToken);
          setUser(userData);

          return userData;
        }
      } catch (error) {
        // If login fails with 401 and the error message indicates device not registered,
        // we could try registration, but this isn't recommended in production
        console.error("Login failed:", error);
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function that uses the real API
  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", userData);

      if (response.data) {
        return {
          success: true,
          message: response.data.message || "Registration successful",
        };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAdmin,
    token,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Export the API instance for use in other parts of the app
export { api };
