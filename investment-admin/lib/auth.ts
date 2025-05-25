// src/lib/auth.ts
import { User } from '../types/auth';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

interface JwtPayload {
  exp: number;
  user_id: number;
  [key: string]: any;
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

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

export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  const user = getUser();
  
  if (!token || !user) {
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

export function logout(): void {
  removeToken();
  removeUser();
}

export function isAdmin(user: User | null): boolean {
  return !!user && user.is_admin;
}