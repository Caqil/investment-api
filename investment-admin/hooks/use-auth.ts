// src/hooks/use-auth.ts
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../types/auth';
import { api } from '../lib/api';
import { 
  getUser, 
  isAuthenticated, 
  logout as logoutUtil, 
  setToken, 
  setUser 
} from '../lib/auth';

// Updated to include device_id
export interface LoginCredentials {
  email: string;
  password: string;
  device_id: string;
}

export function useAuth() {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize user from local storage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const storedUser = getUser();
          if (storedUser) {
            setUserState(storedUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Authentication error. Please login again.');
        logoutUtil();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await api.auth.login(credentials);

        if (error || !data) {
          setError(error || 'Login failed');
          setLoading(false);
          return false;
        }

        const { token, user } = data;
        
        // Check if user is admin
        if (!user.is_admin) {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return false;
        }

        // Store auth data
        setToken(token);
        setUser(user);
        setUserState(user);
        setLoading(false);
        
        return true;
      } catch (err) {
        console.error('Login error:', err);
        setError('An unexpected error occurred during login');
        setLoading(false);
        return false;
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    logoutUtil();
    setUserState(null);
    router.push('/login');
  }, [router]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };
}