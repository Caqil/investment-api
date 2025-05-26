// src/lib/api.ts
import { User, AuthResponse, LoginCredentials } from '../types/auth';
import { Transaction } from '../types/transaction';
import { Plan } from '../types/plan';
import { Withdrawal } from '../types/withdrawal';
import { KYCDocument } from '../types/kyc';
import { Payment } from '../types/payment';
import { Task } from '../types/task';
import { Notification } from '../types/notification';
import { getToken } from './auth';

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
  message?: string;
}

export interface KYCDocumentsResponse {
  kyc_documents: KYCDocument[];
}

export interface KYCDocumentResponse {
  kyc_document: KYCDocument;
  message?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface PaymentResponse {
  payment: Payment;
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
    }
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
    getPending: (): Promise<ApiResponse<WithdrawalsResponse>> => {
      return request<WithdrawalsResponse>('/admin/withdrawals?status=pending');
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
    getStats: (): Promise<ApiResponse<{
      total_payments: number;
      total_amount: number;
      pending_count: number;
      completed_count: number;
      failed_count: number;
    }>> => {
      return request<any>('/admin/payments/stats');
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
// Update the transactions section in lib/api.ts
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
    getAll: (): Promise<ApiResponse<NotificationsResponse>> => {
      return request<NotificationsResponse>('/admin/notifications');
    },
    send: (title: string, message: string): Promise<ApiResponse<MessageResponse>> => {
      return request<MessageResponse>('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title, message })
      });
    }
  }
};