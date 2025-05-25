'use client';

import axios, { AxiosError, AxiosInstance } from 'axios';

// API base URL - configure this according to your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Auth-related types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  device_id: string;
  refer_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  new_password: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  user?: T;
  token?: string;
  [key: string]: any;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  referral_code: string;
  plan_id: number;
  is_kyc_verified: boolean;
  email_verified: boolean;
  is_admin?: boolean;
  is_blocked?: boolean;
  biometric_enabled: boolean;
  profile_pic_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type AuthError = {
  status: number;
  message: string;
  details?: any;
};

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add device ID header if available
    const deviceId = localStorage.getItem('device_id');
    if (deviceId && config.headers) {
      config.headers['X-Device-ID'] = deviceId;
    }
  }
  
  return config;
});

// Handle API errors
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    
    // Handle unauthorized errors (401) - clear token and redirect to login
    if (axiosError.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    
    // Extract error message
    const errorMessage = axiosError.response?.data?.error || 
                         axiosError.response?.data?.message || 
                         axiosError.message || 
                         'An unknown error occurred';
    
    const authError: AuthError = {
      status: axiosError.response?.status || 500,
      message: errorMessage,
    };
    
    throw authError;
  } else if (error instanceof Error) {
    throw {
      status: 500,
      message: error.message,
    } as AuthError;
  } else {
    throw {
      status: 500,
      message: 'An unknown error occurred',
    } as AuthError;
  }
}

// Register a new user
export async function registerUser(data: RegisterRequest): Promise<User> {
  try {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    
    // Store device ID for future requests
    if (typeof window !== 'undefined') {
      localStorage.setItem('device_id', data.device_id);
    }
    
    return response.data.user as User;
  } catch (error) {
    return handleApiError(error);
  }
}

// Verify email
export async function verifyEmail(data: VerifyEmailRequest): Promise<void> {
  try {
    await api.post<ApiResponse>('/auth/verify-email', data);
  } catch (error) {
    handleApiError(error);
  }
}

// admin/lib/auth.ts - Update login function
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    // Store auth data in localStorage and cookies
    if (typeof window !== 'undefined') {
      // Store token
      localStorage.setItem(TOKEN_KEY, response.data.token);
      
      // Store user data
      const safeUser = { ...response.data.user };
      console.log("Logged in user data:", safeUser); // Debug log
      console.log("Is admin:", safeUser.is_admin); // Specifically check admin status
      
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      localStorage.setItem('device_id', data.device_id);
      
      // Set cookies for middleware
      document.cookie = `auth_token=${response.data.token}; path=/; max-age=604800`;
      document.cookie = `user_data=${encodeURIComponent(JSON.stringify(safeUser))}; path=/; max-age=604800`;
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // We keep device_id for future logins
    
    // Remove auth cookies
    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Redirect to login page
    window.location.href = '/login';
  }
}

// Check if user is logged in
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return !!localStorage.getItem(TOKEN_KEY);
}

// Get current user with safe parsing
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Error parsing user data:', error);
    // Don't call logout directly to avoid potential loops
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

// Get auth token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem(TOKEN_KEY);
}

// Export the API instance for other services to use
export { api };