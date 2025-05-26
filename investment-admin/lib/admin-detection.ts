// lib/admin-detection.ts
import { api } from '@/lib/api';

// Store detected admin status
let cachedAdminStatus: boolean | null = null;

export async function detectAdminStatus(): Promise<boolean> {
  // Return cached result if available
  if (cachedAdminStatus !== null) {
    return cachedAdminStatus;
  }
  
  try {
    // Try to access an admin-only endpoint
    // This should be an endpoint that only returns data if the user is an admin
    const response = await api.dashboard.getStats();
    
    // If we get a successful response, the user is an admin
    if (response.data) {
      console.log("Admin status detected via API probe");
      cachedAdminStatus = true;
      
      // Store the admin status
      storeAdminStatus(true);
      return true;
    }
  } catch (error) {
    // If access is denied, the user is not an admin
    console.log("Admin probe failed, user is not an admin");
    cachedAdminStatus = false;
    storeAdminStatus(false);
  }
  
  return false;
}

// Store admin status in both localStorage and cookie
export function storeAdminStatus(isAdmin: boolean): void {
  if (typeof window !== 'undefined') {
    // Store in localStorage
    localStorage.setItem('user_is_admin', isAdmin ? 'true' : 'false');
    
    // Also store in a cookie for middleware
    document.cookie = `user_is_admin=${isAdmin ? 'true' : 'false'}; path=/; max-age=86400`;
    
    // Update cached status
    cachedAdminStatus = isAdmin;
  }
}

// Get admin status from storage
export function getStoredAdminStatus(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_is_admin') === 'true';
  }
  return false;
}

// Clear admin status (on logout)
export function clearAdminStatus(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_is_admin');
    document.cookie = 'user_is_admin=; path=/; max-age=0';
    cachedAdminStatus = null;
  }
}