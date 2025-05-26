// lib/auth.ts
import { User } from '../types/auth';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface JwtPayload {
  exp: number;
  user_id: number;
  is_admin?: boolean;
  [key: string]: any;
}

/**
 * Store authentication token in both localStorage and cookies
 * to ensure it's accessible in both client components and middleware
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    // For client components
    localStorage.setItem(TOKEN_KEY, token);
    
    // For middleware (HTTP-only would be better in production)
    Cookies.set(TOKEN_KEY, token, { 
      expires: 7, // 7 days
      path: '/',
      sameSite: 'strict'
    });
  }
}

/**
 * Get token from localStorage or cookies
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    // Try localStorage first
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return token;
    
    // Then try cookies
    return Cookies.get(TOKEN_KEY) || null;
  }
  return null;
}

/**
 * Remove token from both localStorage and cookies
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    Cookies.remove(TOKEN_KEY, { path: '/' });
  }
}

/**
 * Store user data in localStorage
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    // Also store a simplified version in a cookie for middleware
    const userInfo = { 
      id: user.id, 
      is_admin: user.is_admin 
    };
    Cookies.set('user_info', JSON.stringify(userInfo), { 
      expires: 7,
      path: '/',
      sameSite: 'strict'
    });
  }
}

/**
 * Get user data from localStorage
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson) as User;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        // Clear invalid user data
        removeUser();
      }
    }
  }
  return null;
}

/**
 * Remove user data from both localStorage and cookies
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
    Cookies.remove('user_info', { path: '/' });
  }
}

/**
 * Check if user is authenticated by verifying token expiration
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      // Token expired, clean up
      logout();
      return false;
    }
    
    return true;
  } catch (e) {
    // Invalid token format
    console.error('Invalid token format:', e);
    logout();
    return false;
  }
}

/**
 * Logout user by removing all auth data
 */
export function logout(): void {
  removeToken();
  removeUser();
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return !!user && user.is_admin;
}