import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginationParams } from '../types/api';
import { LoginResponse } from '@/types/auth';
import { DashboardStats } from '@/types/dashboard';
import { User } from '@/types/user';
import { Withdrawal } from '@/types/withdrawal';
import { KYCDocument } from '@/types/kyc';
import { Plan } from '@/types/plan';
import { Task } from '@/types/task';
import { Transaction } from '@/types/transaction';

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
  getAll: (params?: PaginationParams): Promise<{ users: User[], total: number }> => 
    get<{ users: User[], total: number }>('/admin/users', params),
  getById: (id: number): Promise<User> => 
    get<User>(`/admin/users/${id}`),
  block: (id: number): Promise<{ message: string }> => 
    put<{ message: string }>(`/admin/users/${id}/block`, {}),
  unblock: (id: number): Promise<{ message: string }> => 
    put<{ message: string }>(`/admin/users/${id}/unblock`, {}),
};

// Withdrawals
export const withdrawalsApi = {
  getAll: (params?: PaginationParams & { status?: string }): Promise<{ withdrawals: Withdrawal[], total: number }> => 
    get<{ withdrawals: Withdrawal[], total: number }>('/admin/withdrawals', params),
  getById: (id: number): Promise<Withdrawal> => 
    get<Withdrawal>(`/admin/withdrawals/${id}`),
  approve: (id: number, adminNote: string): Promise<{ message: string }> => 
    put<{ message: string }>(`/admin/withdrawals/${id}/approve`, { admin_note: adminNote }),
  reject: (id: number, reason: string): Promise<{ message: string }> => 
    put<{ message: string }>(`/admin/withdrawals/${id}/reject`, { reason }),
};

// KYC
export const kycApi = {
  getAll: (params?: PaginationParams & { status?: string }): Promise<{ kyc_documents: KYCDocument[], total: number }> => 
    get<{ kyc_documents: KYCDocument[], total: number }>('/admin/kyc', params),
  getById: (id: number): Promise<KYCDocument> => 
    get<KYCDocument>(`/admin/kyc/${id}`),
  approve: (id: number): Promise<{ message: string }> => 
    put<{ message: string }>(`/admin/kyc/${id}/approve`, {}),
  reject: (id: number, reason: string): Promise<{ message: string }> => 
    put<{ message: string }>(`/admin/kyc/${id}/reject`, { reason }),
};

// Plans
export const plansApi = {
  getAll: (): Promise<{ plans: Plan[] }> => 
    get<{ plans: Plan[] }>('/admin/plans'),
  getById: (id: number): Promise<Plan> => 
    get<Plan>(`/admin/plans/${id}`),
  create: (planData: {
    name: string,
    daily_deposit_limit: number,
    daily_withdrawal_limit: number,
    daily_profit_limit: number,
    price: number,
    is_default: boolean
  }): Promise<{ message: string, plan: Plan }> => 
    post<{ message: string, plan: Plan }>('/admin/plans', planData),
  update: (id: number, planData: {
    name: string,
    daily_deposit_limit: number,
    daily_withdrawal_limit: number,
    daily_profit_limit: number,
    price: number,
    is_default: boolean
  }): Promise<{ message: string, plan: Plan }> => 
    put<{ message: string, plan: Plan }>(`/admin/plans/${id}`, planData),
  delete: (id: number): Promise<{ message: string }> => 
    del<{ message: string }>(`/admin/plans/${id}`),
};

// Tasks
export const tasksApi = {
  getAll: (): Promise<{ tasks: Task[] }> => 
    get<{ tasks: Task[] }>('/admin/tasks'),
  getById: (id: number): Promise<Task> => 
    get<Task>(`/admin/tasks/${id}`),
  create: (taskData: {
    name: string,
    description: string,
    task_type: string,
    task_url: string,
    is_mandatory: boolean
  }): Promise<{ message: string, task: Task }> => 
    post<{ message: string, task: Task }>('/admin/tasks', taskData),
  update: (id: number, taskData: {
    name: string,
    description: string,
    task_type: string,
    task_url: string,
    is_mandatory: boolean
  }): Promise<{ message: string, task: Task }> => 
    put<{ message: string, task: Task }>(`/admin/tasks/${id}`, taskData),
  delete: (id: number): Promise<{ message: string }> => 
    del<{ message: string }>(`/admin/tasks/${id}`),
};

// Transactions
export const transactionsApi = {
  getAll: (params?: PaginationParams & { type?: string }): Promise<{ transactions: Transaction[], total: number }> => 
    get<{ transactions: Transaction[], total: number }>('/admin/transactions', params),
  getById: (id: number): Promise<Transaction> => 
    get<Transaction>(`/admin/transactions/${id}`),
};

// Notifications
export const notificationsApi = {
  send: (data: { title: string, message: string }): Promise<{ message: string }> => 
    post<{ message: string }>('/admin/notifications', data),
};

// Dashboard stats
export const dashboardApi = {
  getStats: (): Promise<DashboardStats> => 
    get<DashboardStats>('/admin/dashboard/stats'),
};

export { apiClient, get, post, put, del };