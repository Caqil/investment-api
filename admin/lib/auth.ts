import { LoginRequest } from '../types/auth';
import { User } from '../types/user';
import { authApi } from './api';

const TOKEN_KEY = process.env.NEXT_PUBLIC_API_TOKEN_KEY || 'investment_admin_token';
const USER_KEY = 'investment_admin_user';
// Login function
export const login = async (credentials: LoginRequest): Promise<User> => {
    try {
      const response = await authApi.login(credentials.email, credentials.password);
      
      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        
        // Also set as cookie for middleware
        document.cookie = `${TOKEN_KEY}=${response.token}; path=/; max-age=${60*60*24*7}`;
      }
      
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

// Logout function
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
  }
};

// Get current user
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

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return !!localStorage.getItem(TOKEN_KEY);
};

// Get auth token
export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem(TOKEN_KEY);
};

// Check if user is admin
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return !!user?.is_admin;
};

// Update stored user data
export const updateUserData = (userData: Partial<User>): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return;
  }
  
  const updatedUser = { ...currentUser, ...userData };
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
};