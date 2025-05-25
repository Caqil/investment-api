import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginationParams } from '../types/api';
import { LoginResponse } from '@/types/auth';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or other storage)
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem(process.env.NEXT_PUBLIC_API_TOKEN_KEY || 'investment_admin_token')
      : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem(process.env.NEXT_PUBLIC_API_TOKEN_KEY || 'investment_admin_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic GET request
const get = async <T>(url: string, params?: any): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

// Generic POST request
const post = async <T>(url: string, data: any): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error posting data to ${url}:`, error);
    throw error;
  }
};

// Generic PUT request
const put = async <T>(url: string, data: any): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating data at ${url}:`, error);
    throw error;
  }
};

// Generic DELETE request
const del = async <T>(url: string): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url);
    return response.data.data;
  } catch (error) {
    console.error(`Error deleting data at ${url}:`, error);
    throw error;
  }
};

// ===== API Service Functions =====

// Auth
export const authApi = {
    login: (email: string, password: string): Promise<LoginResponse> => 
      post<LoginResponse>('/auth/login', { email, password }),
  };

// Users
export const usersApi = {
  getAll: (params?: PaginationParams) => 
    get('/admin/users', params),
  getById: (id: number) => 
    get(`/admin/users/${id}`),
  block: (id: number) => 
    put(`/admin/users/${id}/block`, {}),
  unblock: (id: number) => 
    put(`/admin/users/${id}/unblock`, {}),
};

// Withdrawals
export const withdrawalsApi = {
  getAll: (params?: PaginationParams & { status?: string }) => 
    get('/admin/withdrawals', params),
  getById: (id: number) => 
    get(`/admin/withdrawals/${id}`),
  approve: (id: number, adminNote: string) => 
    put(`/admin/withdrawals/${id}/approve`, { admin_note: adminNote }),
  reject: (id: number, reason: string) => 
    put(`/admin/withdrawals/${id}/reject`, { reason }),
};

// KYC
export const kycApi = {
  getAll: (params?: PaginationParams & { status?: string }) => 
    get('/admin/kyc', params),
  getById: (id: number) => 
    get(`/admin/kyc/${id}`),
  approve: (id: number) => 
    put(`/admin/kyc/${id}/approve`, {}),
  reject: (id: number, reason: string) => 
    put(`/admin/kyc/${id}/reject`, { reason }),
};

// Plans
export const plansApi = {
  getAll: () => 
    get('/admin/plans'),
  getById: (id: number) => 
    get(`/admin/plans/${id}`),
  create: (planData: {
    name: string,
    daily_deposit_limit: number,
    daily_withdrawal_limit: number,
    daily_profit_limit: number,
    price: number,
    is_default: boolean
  }) => 
    post('/admin/plans', planData),
  update: (id: number, planData: {
    name: string,
    daily_deposit_limit: number,
    daily_withdrawal_limit: number,
    daily_profit_limit: number,
    price: number,
    is_default: boolean
  }) => 
    put(`/admin/plans/${id}`, planData),
  delete: (id: number) => 
    del(`/admin/plans/${id}`),
};

// Tasks
export const tasksApi = {
  getAll: () => 
    get('/admin/tasks'),
  getById: (id: number) => 
    get(`/admin/tasks/${id}`),
  create: (taskData: {
    name: string,
    description: string,
    task_type: string,
    task_url: string,
    is_mandatory: boolean
  }) => 
    post('/admin/tasks', taskData),
  update: (id: number, taskData: {
    name: string,
    description: string,
    task_type: string,
    task_url: string,
    is_mandatory: boolean
  }) => 
    put(`/admin/tasks/${id}`, taskData),
  delete: (id: number) => 
    del(`/admin/tasks/${id}`),
};

// Transactions
export const transactionsApi = {
  getAll: (params?: PaginationParams & { type?: string }) => 
    get('/admin/transactions', params),
  getById: (id: number) => 
    get(`/admin/transactions/${id}`),
};

// Notifications
export const notificationsApi = {
  send: (data: { title: string, message: string }) => 
    post('/admin/notifications', data),
};

// Dashboard stats
export const dashboardApi = {
  getStats: () => 
    get('/admin/dashboard/stats'),
};

export { apiClient, get, post, put, del };