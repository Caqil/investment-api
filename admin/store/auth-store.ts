import { create } from 'zustand';
import { login as apiLogin, getCurrentUser, logout as apiLogout } from '../lib/auth';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  
  // Login function
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const user = await apiLogin({ email, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
        isAuthenticated: false
      });
    }
  },
  
  // Logout function
  logout: () => {
    apiLogout();
    set({ user: null, isAuthenticated: false });
  },
  
  // Initialize auth state from localStorage
  initialize: () => {
    const user = getCurrentUser();
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    });
  }
}));