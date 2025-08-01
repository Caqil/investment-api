// src/lib/api.ts
import { User, AuthResponse, LoginCredentials } from '../types/auth';
import { Transaction } from '../types/transaction';
import { Plan } from '../types/plan';
import { Withdrawal } from '../types/withdrawal';
import { KYCDocument } from '../types/kyc';
import { Payment } from '../types/payment';
import { Task } from '../types/task';
import { Notification, NotificationStats } from '../types/notification';
import { getToken } from './auth';
import { AppSettings, Setting } from '@/types/setting';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Define response types for all endpoints
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Define specific response interfaces
export interface UsersResponse {
  users: User[];
}

export interface UserResponse {
  user: User;
}
export interface UserStatsResponse {
  total_users: number;
  active_users: number;
  blocked_users: number;
  verified_users: number;
  plan_distribution: Array<{name: string; value: number}>;
}
export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  balance?: number;
  is_admin?: boolean;
  is_blocked?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  balance?: number;
  is_admin?: boolean;
  is_blocked?: boolean;
}
export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface PlansResponse {
  plans: Plan[];
}

export interface PlanResponse {
  plan: Plan;
  message?: string;
}

export interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
}

export interface WithdrawalResponse {
  withdrawal: Withdrawal;
  user: User;
  message?: string;
}

export interface KYCDocumentsResponse {
  kyc_documents: KYCDocument[];
}

export interface KYCDocumentResponse {
  kyc_document: KYCDocument;
  user?: User;
  message?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
}
export interface PaymentStatsResponse {
  total_payments: number;
  pending_count: number;
  completed_count: number;
  failed_count: number;
  manual_count?: number;
  coingate_count?: number;
  uddoktapay_count?: number;
  total_amount: number;
  recent_payments: Payment[];
}
export interface PaymentResponse {
  payment: Payment;
  transaction?: Transaction;
  message?: string;
}

export interface TasksResponse {
  tasks: Task[];
}

export interface TaskResponse {
  task: Task;
  message?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export interface MessageResponse {
  message: string;
}
export interface StatsResponse {
  total_users: number;
  active_users: number;
  pending_withdrawals: number;
  pending_kyc: number;
  recent_users: User[];
  recent_withdrawals: Withdrawal[];
  plan_distribution: Array<{name: string; value: number}>;
}

export interface SettingsResponse {
  settings: Setting[];
}

export interface SettingResponse {
  setting: Setting;
  message?: string;
}

export interface AppSettingsResponse {
  settings: AppSettings;
}

/**
 * Generic request function with proper error handling and typing
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    
    // Create headers object
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add cache control for GET requests to prevent stale data
    if (!options.method || options.method === 'GET') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // For non-json responses
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!response.ok) {
        return {
          error: `Request failed with status ${response.status}`
        };
      }
      return { data: {} as T };
    }

    const responseData = await response.json();

    if (!response.ok) {
      return {
        error: responseData.error || `Request failed with status ${response.status}`
      };
    }

    return { data: responseData };
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          device_id: credentials.device_id
        })
      });
    },
    validateToken: (): Promise<ApiResponse<{ valid: boolean }>> => {
      return request<{ valid: boolean }>('/auth/validate');
    }
  },
  
  // Dashboard data endpoints
  dashboard: {
    getStats: (): Promise<ApiResponse<StatsResponse>> => {
      return request<StatsResponse>('/admin/stats');
    }
  },
  
  // User endpoints
  users: {
    getAll: (): Promise<ApiResponse<UsersResponse>> => {
      return request<UsersResponse>('/admin/users');
    },
    getById: (id: number): Promise<ApiResponse<UserResponse>> => {
      return request<UserResponse>(`/admin/users/${id}`);
    },
    create: (userData: CreateUserRequest): Promise<ApiResponse<UserResponse>> => {
      return request<UserResponse>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    update: (id: number, userData: UpdateUserRequest): Promise<ApiResponse<UserResponse>> => {
      return request<UserResponse>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    },
    delete: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/users/${id}`, {
        method: 'DELETE'
      });
    },
    block: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/users/${id}/block`, { method: 'PUT' });
    },
    unblock: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/users/${id}/unblock`, { method: 'PUT' });
    },
    getStats: (): Promise<ApiResponse<UserStatsResponse>> => {
      return request<UserStatsResponse>('/admin/users/stats');
    },
  },
  
  // Plan endpoints
  plans: {
    getAll: (): Promise<ApiResponse<PlansResponse>> => {
      return request<PlansResponse>('/plans');
    },
    create: (planData: Record<string, any>): Promise<ApiResponse<PlanResponse>> => {
      return request<PlanResponse>('/admin/plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
    },
    update: (id: number, planData: Record<string, any>): Promise<ApiResponse<PlanResponse>> => {
      return request<PlanResponse>(`/admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(planData)
      });
    },
    delete: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/plans/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Withdrawal endpoints
  withdrawals: {
    getAll: (): Promise<ApiResponse<WithdrawalsResponse>> => {
      return request<WithdrawalsResponse>('/admin/withdrawals');
    },
    getById: (id: number): Promise<ApiResponse<WithdrawalResponse>> => {
      return request<WithdrawalResponse>(`/admin/withdrawals/${id}`);
    },
    getPending: (): Promise<ApiResponse<WithdrawalsResponse>> => {
      return request<WithdrawalsResponse>('/admin/withdrawals?status=pending');
    },
    getStats: (): Promise<ApiResponse<{
      pending_count: number;
      approved_count: number;
      rejected_count: number;
      recent_withdrawals: Withdrawal[];
    }>> => {
      return request<any>('/admin/withdrawals/stats');
    },
    approve: (id: number, adminNote: string): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/withdrawals/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ admin_note: adminNote })
      });
    },
    reject: (id: number, reason: string): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/withdrawals/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    }
  },
  
  // KYC endpoints
  kyc: {
    getAll: (): Promise<ApiResponse<KYCDocumentsResponse>> => {
      return request<KYCDocumentsResponse>('/admin/kyc');
    },
    getById: (id: number): Promise<ApiResponse<KYCDocumentResponse>> => {
      return request<KYCDocumentResponse>(`/admin/kyc/${id}`);
    },
    getPending: (): Promise<ApiResponse<KYCDocumentsResponse>> => {
      return request<KYCDocumentsResponse>('/admin/kyc?status=pending');
    },
    approve: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/kyc/${id}/approve`, {
        method: 'PUT'
      });
    },
    reject: (id: number, reason: string): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/kyc/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    }
  },
  
  // Payment endpoints
  payments: {
    getAll: (): Promise<ApiResponse<PaymentsResponse>> => {
      return request<PaymentsResponse>('/admin/payments');
    },
    getPending: (): Promise<ApiResponse<PaymentsResponse>> => {
      return request<PaymentsResponse>('/admin/payments/pending');
    },
    getById: (id: number): Promise<ApiResponse<PaymentResponse>> => {
      return request<PaymentResponse>(`/admin/payments/${id}`);
    },
    approve: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/payments/${id}/approve`, {
        method: 'PUT'
      });
    },
    reject: (id: number, reason: string): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/payments/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    },
    getStats: (): Promise<ApiResponse<PaymentStatsResponse>> => {
      return request<PaymentStatsResponse>('/admin/payments/stats');
    }
  },
  
  // Task endpoints
  tasks: {
    getAll: (): Promise<ApiResponse<TasksResponse>> => {
      return request<TasksResponse>('/tasks');
    },
    create: (taskData: Record<string, any>): Promise<ApiResponse<TaskResponse>> => {
      return request<TaskResponse>('/admin/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    },
    update: (id: number, taskData: Record<string, any>): Promise<ApiResponse<TaskResponse>> => {
      return request<TaskResponse>(`/admin/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      });
    },
    delete: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/tasks/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Transaction endpoints
  transactions: {
    getAll: (): Promise<ApiResponse<TransactionsResponse>> => {
      return request<TransactionsResponse>('/admin/transactions');
    },
    getByUserId: (userId: number, limit: number = 10, offset: number = 0): Promise<ApiResponse<TransactionsResponse>> => {
      return request<TransactionsResponse>(`/admin/users/${userId}/transactions?limit=${limit}&offset=${offset}`);
    },
    getRecentTransactions: (limit: number = 5): Promise<ApiResponse<TransactionsResponse>> => {
      return request<TransactionsResponse>(`/admin/transactions/recent?limit=${limit}`);
    }
  },
  
  // Notification endpoints
  notifications: {
    getAll: (options?: { 
      user_id?: number; 
      type?: string; 
      is_read?: boolean;
      limit?: number;
      offset?: number;
    }): Promise<ApiResponse<{ notifications: Notification[]; total: number }>> => {
      // Build query string
      const queryParams = new URLSearchParams();
      if (options?.user_id) queryParams.append('user_id', options.user_id.toString());
      if (options?.type) queryParams.append('type', options.type);
      if (options?.is_read !== undefined) queryParams.append('is_read', options.is_read.toString());
      if (options?.limit) queryParams.append('limit', options.limit.toString());
      if (options?.offset) queryParams.append('offset', options.offset.toString());
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      return request<{ notifications: Notification[]; total: number }>(`/admin/notifications${queryString}`);
    },
    
    getStats: (): Promise<ApiResponse<NotificationStats>> => {
      return request<NotificationStats>('/admin/notifications/stats');
    },
    
    send: (data: { user_id?: number; title: string; message: string }): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    markAsRead: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/notifications/${id}/read`, {
        method: 'PUT',
      });
    },
    
    delete: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/notifications/${id}`, {
        method: 'DELETE',
      });
    },
  },

  userNotifications: {
    getAll: (limit = 10, offset = 0): Promise<ApiResponse<{ notifications: Notification[]; unread_count: number }>> => {
      return request<{ notifications: Notification[]; unread_count: number }>(`/notifications?limit=${limit}&offset=${offset}`);
    },
    
    getUnreadCount: (): Promise<ApiResponse<{ unread_count: number }>> => {
      // Make sure the token is included in the request headers
      const token = getToken();
      if (!token) {
        return Promise.resolve({ error: 'No authentication token' });
      }
      
      // Check for non-standard device ID requirement
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        // If your API requires a device ID, add it here
        'X-Device-ID': 'web-admin-dashboard' // Use a consistent value for the admin dashboard
      };
      
      return request<{ unread_count: number }>('/notifications/unread-count', {
        headers
      });
    },
    
    markAsRead: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    },
    
    markAllAsRead: (): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>('/notifications/mark-all-read', {
        method: 'PUT',
      });
    },
  },

  // Settings endpoints
  settings: {
    getAll: (endpoint?: string): Promise<ApiResponse<SettingsResponse>> => {
      return request<SettingsResponse>(endpoint || '/admin/settings');
    },
    getById: (id: number): Promise<ApiResponse<SettingResponse>> => {
      return request<SettingResponse>(`/admin/settings/${id}`);
    },
    getByKey: (key: string): Promise<ApiResponse<SettingResponse>> => {
      return request<SettingResponse>(`/admin/settings/key/${key}`);
    },
    create: (settingData: Partial<Setting>): Promise<ApiResponse<SettingResponse>> => {
      return request<SettingResponse>('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settingData)
      });
    },
    update: (id: number, settingData: Partial<Setting>): Promise<ApiResponse<SettingResponse>> => {
      return request<SettingResponse>(`/admin/settings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(settingData)
      });
    },
    updateValue: (key: string, value: string): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/settings/key/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });
    },
    delete: (id: number): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>(`/admin/settings/${id}`, {
        method: 'DELETE'
      });
    },
    getAppSettings: (): Promise<ApiResponse<AppSettingsResponse>> => {
      return request<AppSettingsResponse>('/admin/app-settings');
    },
  },
};