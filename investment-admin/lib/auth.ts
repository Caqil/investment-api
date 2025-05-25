// src/lib/auth.ts
import { User } from '../types/auth';

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

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
  return !!getToken() && !!getUser();
}

export function logout(): void {
  removeToken();
  removeUser();
}

export function isAdmin(user: User | null): boolean {
  return !!user && user.is_admin;
}

// Function to check if token is expired (for JWT tokens)
export function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return exp < currentTime;
  } catch (e) {
    console.error('Error checking token expiration:', e);
    return true; // If we can't parse the token, assume it's expired
  }
}