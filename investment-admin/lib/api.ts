// src/lib/api.ts
import { ApiResponse } from '../types/api';
import { AuthResponse, LoginCredentials } from '../types/auth';
import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * Generic request function with error handling
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    
    // Create headers object with type assertion
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    } as Record<string, string>;

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
    if (!response.headers.get('content-type')?.includes('application/json')) {
      if (!response.ok) {
        return {
          error: `Request failed with status ${response.status}`
        };
      }
      return { data: {} as T };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `Request failed with status ${response.status}`
      };
    }

    return { data: data as T };
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
    login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          device_id: credentials.device_id
        })
      });
    },
    validateToken: async (): Promise<ApiResponse<{ valid: boolean }>> => {
      return request<{ valid: boolean }>('/auth/validate');
    }
  },
  
  // Dashboard data endpoints
  dashboard: {
    getStats: async (): Promise<ApiResponse<any>> => {
      return request('/admin/stats');
    }
  },
  
  // User endpoints
  users: {
    getAll: async () => {
      return request('/admin/users');
    },
    getById: async (id: number) => {
      return request(`/admin/users/${id}`);
    },
    block: async (id: number) => {
      return request(`/admin/users/${id}/block`, { method: 'PUT' });
    },
    unblock: async (id: number) => {
      return request(`/admin/users/${id}/unblock`, { method: 'PUT' });
    }
  },
  
  // Plan endpoints
  plans: {
    getAll: async () => {
      return request('/plans');
    },
    create: async (planData: any) => {
      return request('/admin/plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });
    },
    update: async (id: number, planData: any) => {
      return request(`/admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(planData)
      });
    },
    delete: async (id: number) => {
      return request(`/admin/plans/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Withdrawal endpoints
  withdrawals: {
    getAll: async () => {
      return request('/admin/withdrawals');
    },
    getPending: async () => {
      return request('/admin/withdrawals?status=pending');
    },
    approve: async (id: number, adminNote: string) => {
      return request(`/admin/withdrawals/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ admin_note: adminNote })
      });
    },
    reject: async (id: number, reason: string) => {
      return request(`/admin/withdrawals/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    }
  },
  
  // KYC endpoints
  kyc: {
    getAll: async () => {
      return request('/admin/kyc');
    },
    getPending: async () => {
      return request('/admin/kyc?status=pending');
    },
    approve: async (id: number) => {
      return request(`/admin/kyc/${id}/approve`, {
        method: 'PUT'
      });
    },
    reject: async (id: number, reason: string) => {
      return request(`/admin/kyc/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    }
  },
  
  // Payment endpoints
  payments: {
    getPending: async () => {
      return request('/admin/payments/pending');
    },
    approve: async (id: number) => {
      return request(`/admin/payments/${id}/approve`, {
        method: 'PUT'
      });
    },
    reject: async (id: number, reason: string) => {
      return request(`/admin/payments/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
    }
  },
  
  // Task endpoints
  tasks: {
    getAll: async () => {
      return request('/tasks');
    },
    create: async (taskData: any) => {
      return request('/admin/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    },
    update: async (id: number, taskData: any) => {
      return request(`/admin/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      });
    },
    delete: async (id: number) => {
      return request(`/admin/tasks/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  // Transaction endpoints
  transactions: {
    getAll: async () => {
      // Replace with your actual endpoint for transactions
      return request('/admin/transactions');
    }
  },
  
  // Notification endpoints
  notifications: {
    send: async (title: string, message: string) => {
      return request('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title, message })
      });
    }
  }
};