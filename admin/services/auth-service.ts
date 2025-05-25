import axios from 'axios';
import { User } from '../types/user';

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const TOKEN_KEY = process.env.NEXT_PUBLIC_API_TOKEN_KEY || 'investment_admin_token';
const USER_KEY = 'investment_admin_user';

// Interface for login request
interface LoginRequest {
  email: string;
  password: string;
  device_id?: string; // Optional for web admin
}

// Interface for login response
interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Login function - attempts to authenticate with the backend
 */
export const login = async (credentials: { email: string; password: string }): Promise<User> => {
  try {
    // Create request payload
    const requestPayload: LoginRequest = {
      email: credentials.email,
      password: credentials.password,
      device_id: 'web-admin', // Use a fixed value for admin panel
    };

    console.log('Attempting login to:', `${API_URL}/auth/login`);
    
    // Make API request
    const response = await axios.post<{ token: string; user: User }>(
      `${API_URL}/auth/login`, 
      requestPayload
    );
    
    // Extract data
    const { token, user } = response.data;
    
    // Store token and user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Also set as cookie for middleware
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60*60*24*7}`;
    }
    
    return user;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message || error);
    throw error;
  }
};

/**
 * Logout function - clears authentication data
 */
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Clear the cookie
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    // Redirect to login
    window.location.href = '/login';
  }
};

/**
 * Get current user from storage
 */
export const getCurrentUser = (): User | null => {
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
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return !!user?.is_admin;
};