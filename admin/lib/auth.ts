'use client';

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// API base URL - configure this according to your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const DEVICE_KEY = 'device_id';

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

export interface EnableBiometricRequest {
  user_id: number;
}

export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  user?: T;
  token?: string;
  [key: string]: any; // Allow for additional fields
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  referral_code: string;
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
    const deviceId = localStorage.getItem(DEVICE_KEY);
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
      details: axiosError.response?.data
    };
    
    throw authError;
  } else if (error instanceof Error) {
    throw {
      status: 500,
      message: error.message,
      details: error
    } as AuthError;
  } else {
    throw {
      status: 500,
      message: 'An unknown error occurred',
      details: error
    } as AuthError;
  }
}

// Register a new user
export async function registerUser(data: RegisterRequest): Promise<User> {
  try {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    
    // Store device ID for future requests
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEVICE_KEY, data.device_id);
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

// Resend verification code
export async function resendVerificationCode(email: string): Promise<void> {
  try {
    await api.post<ApiResponse>('/auth/resend-verification', { email });
  } catch (error) {
    handleApiError(error);
  }
}

// Login user
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    // Store auth data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      localStorage.setItem(DEVICE_KEY, data.device_id);
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

// Request password reset
export async function forgotPassword(email: string): Promise<void> {
  try {
    await api.post<ApiResponse>('/auth/forgot-password', { email });
  } catch (error) {
    handleApiError(error);
  }
}

// Reset password
export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  try {
    await api.post<ApiResponse>('/auth/reset-password', data);
  } catch (error) {
    handleApiError(error);
  }
}

// Enable biometric authentication
export async function enableBiometric(): Promise<void> {
  try {
    await api.post<ApiResponse>('/user/enable-biometric');
  } catch (error) {
    handleApiError(error);
  }
}

// Disable biometric authentication
export async function disableBiometric(): Promise<void> {
  try {
    await api.post<ApiResponse>('/user/disable-biometric');
  } catch (error) {
    handleApiError(error);
  }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    await api.put<ApiResponse>('/user/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  } catch (error) {
    handleApiError(error);
  }
}

// Update user profile
export async function updateProfile(data: {
  name: string;
  phone: string;
  profile_pic_url?: string;
}): Promise<User> {
  try {
    const response = await api.put<ApiResponse<User>>('/user/profile', data);
    
    // Update stored user data
    const updatedUser = response.data.user;
    if (typeof window !== 'undefined' && updatedUser) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        localStorage.setItem(USER_KEY, JSON.stringify({
          ...currentUser,
          ...updatedUser
        }));
      }
    }
    
    return response.data.user as User;
  } catch (error) {
    return handleApiError(error);
  }
}

// Logout user
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Keep device ID for future logins
    
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

// Get current user
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
    logout(); // Clear invalid data
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

// Get stored device ID
export function getStoredDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem(DEVICE_KEY);
}

// Store device ID
export function storeDeviceId(deviceId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
}

// Check if user has verified email
export function isEmailVerified(): boolean {
  const user = getCurrentUser();
  return !!user?.email_verified;
}

// Check if user has completed KYC
export function isKycVerified(): boolean {
  const user = getCurrentUser();
  return !!user?.is_kyc_verified;
}

// Check if user has biometric enabled
export function isBiometricEnabled(): boolean {
  const user = getCurrentUser();
  return !!user?.biometric_enabled;
}

// Export the API instance for other services to use
export { api };