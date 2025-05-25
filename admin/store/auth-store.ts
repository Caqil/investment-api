// store/auth-store.ts
import { create } from 'zustand';
import { getDeviceId } from '@/lib/device';
import { api } from '@/lib/auth';

type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  [key: string]: any;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  // Initialize state from localStorage on client-side only
  checkAuth: () => {
    if (typeof window === 'undefined') return false;
    
    try {
      const token = localStorage.getItem('investment_admin_token');
      const userStr = localStorage.getItem('user_data');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
        return true;
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
    
    return false;
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get device ID
      const deviceId = await getDeviceId();
      
      // Make login request
      const response = await api.post('/auth/login', {
        email,
        password,
        device_id: deviceId
      });
      
      if (response.data && response.data.token) {
        // Store in state
        set({ 
          token: response.data.token, 
          user: response.data.user, 
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('investment_admin_token', response.data.token);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          
          // Set cookie for middleware
          document.cookie = `auth_token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
      } else {
        set({ 
          isLoading: false, 
          error: 'Invalid response from server',
          isAuthenticated: false 
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      set({ 
        isLoading: false, 
        error: err.response?.data?.error || 'Failed to login. Please check your credentials.',
        isAuthenticated: false 
      });
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('investment_admin_token');
      localStorage.removeItem('user_data');
      document.cookie = 'auth_token=; path=/; max-age=0';
      window.location.href = '/login';
    }
  },
}));