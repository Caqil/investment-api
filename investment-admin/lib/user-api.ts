// lib/user-api.ts
import { getToken } from './auth';
import { User } from '../types/auth';
import { Transaction } from '../types/transaction';
import { Withdrawal } from '../types/withdrawal';
import { KYCDocument, DocumentType, KYCStatus } from '../types/kyc';
import { Plan } from '../types/plan';
import { Task } from '../types/task';
import { Notification } from '../types/notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Define response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// User profile responses
export interface ProfileResponse {
  user: User;
  devices: any[];
  referral_earnings: number;
  referral_count: number;
}

// Transactions responses
export interface TransactionsResponse {
  transactions: Transaction[];
}

// Withdrawals responses
export interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
}

export interface WithdrawalLimitResponse {
  can_withdraw: boolean;
  remaining_limit: number;
}

// KYC responses
export interface KYCStatusResponse {
  kyc_submitted: boolean;
  kyc?: KYCDocument;
}

// Plans responses
export interface PlansResponse {
  plans: Plan[];
}

// Tasks responses
export interface TasksResponse {
  tasks: Task[];
}

// Notifications responses
export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

// Referrals responses
export interface ReferralsResponse {
  referrals: User[];
  total_referrals: number;
  total_earnings: number;
}

export interface ReferralEarningsResponse {
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
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

    // Add device ID for user requests (would come from secure storage in a real app)
    const deviceId = localStorage.getItem('device_id');
    if (deviceId) {
      headers['X-Device-ID'] = deviceId;
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

export const userApi = {
  // Profile endpoints
  profile: {
    getProfile: (): Promise<ApiResponse<ProfileResponse>> => {
      return request<ProfileResponse>('/user/profile');
    },
    updateProfile: (data: { name: string; phone: string; profile_pic_url?: string }): Promise<ApiResponse<{ user: User; message: string }>> => {
      return request<{ user: User; message: string }>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    changePassword: (data: { current_password: string; new_password: string }): Promise<ApiResponse<{ message: string }>> => {
      return request<{ message: string }>('/user/change-password', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    enableBiometric: (): Promise<ApiResponse<{ message: string }>> => {
      return request<{ message: string }>('/user/enable-biometric', {
        method: 'POST'
      });
    }
  },
  
  // Transaction endpoints
  transactions: {
    getAll: (): Promise<ApiResponse<TransactionsResponse>> => {
      return request<TransactionsResponse>('/user/transactions');
    }
  },
  
  // Withdrawal endpoints
  withdrawals: {
    getAll: (): Promise<ApiResponse<WithdrawalsResponse>> => {
      return request<WithdrawalsResponse>('/withdrawals');
    },
    request: (data: { 
      amount: number; 
      payment_method: string; 
      payment_details: Record<string, any>; 
    }): Promise<ApiResponse<{ message: string; withdrawal: Withdrawal }>> => {
      return request<{ message: string; withdrawal: Withdrawal }>('/withdrawals', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },
  
  // Deposit endpoints
  deposits: {
    viaManual: (data: { 
      amount: number; 
      transaction_id: string; 
      payment_method: string; 
      sender_information: Record<string, any>; 
    }): Promise<ApiResponse<{ message: string; payment: any }>> => {
      return request<{ message: string; payment: any }>('/payments/deposit/manual', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    viaCoingate: (data: { amount: number }): Promise<ApiResponse<{ message: string; payment_url: string; payment: any }>> => {
      return request<{ message: string; payment_url: string; payment: any }>('/payments/deposit/coingate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    viaUddoktaPay: (data: { amount: number }): Promise<ApiResponse<{ message: string; payment_url: string; payment: any }>> => {
      return request<{ message: string; payment_url: string; payment: any }>('/payments/deposit/uddoktapay', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },
  
  // KYC endpoints
  kyc: {
    getStatus: (): Promise<ApiResponse<KYCStatusResponse>> => {
      return request<KYCStatusResponse>('/kyc/status');
    },
    submit: (data: { 
      document_type: DocumentType; 
      document_front_url: string; 
      document_back_url?: string; 
      selfie_url: string; 
    }): Promise<ApiResponse<{ message: string; kyc: KYCDocument }>> => {
      return request<{ message: string; kyc: KYCDocument }>('/kyc/submit', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },
  
  // Plans endpoints
  plans: {
    getAll: (): Promise<ApiResponse<PlansResponse>> => {
      return request<PlansResponse>('/plans');
    },
    purchase: (planId: number): Promise<ApiResponse<{ message: string; plan: Plan }>> => {
      return request<{ message: string; plan: Plan }>(`/plans/${planId}/purchase`, {
        method: 'POST'
      });
    }
  },
  
  // Tasks endpoints
  tasks: {
    getAll: (): Promise<ApiResponse<TasksResponse>> => {
      return request<TasksResponse>('/tasks');
    },
    complete: (taskId: number): Promise<ApiResponse<{ 
      message: string; 
      all_mandatory_completed: boolean;
    }>> => {
      return request<{ message: string; all_mandatory_completed: boolean }>(`/tasks/${taskId}/complete`, {
        method: 'POST'
      });
    }
  },
  
  // Notifications endpoints
  notifications: {
    getAll: (limit = 10, offset = 0): Promise<ApiResponse<NotificationsResponse>> => {
      return request<NotificationsResponse>(`/notifications?limit=${limit}&offset=${offset}`);
    },
    getUnreadCount: (): Promise<ApiResponse<{ unread_count: number }>> => {
      return request<{ unread_count: number }>('/notifications/unread-count');
    },
    markAsRead: (id: number): Promise<ApiResponse<{ message: string }>> => {
      return request<{ message: string }>(`/notifications/${id}/read`, {
        method: 'PUT'
      });
    },
    markAllAsRead: (): Promise<ApiResponse<{ message: string }>> => {
      return request<{ message: string }>('/notifications/mark-all-read', {
        method: 'PUT'
      });
    }
  },
  
  // Referrals endpoints
  referrals: {
    getAll: (): Promise<ApiResponse<ReferralsResponse>> => {
      return request<ReferralsResponse>('/referrals');
    },
    getEarnings: (): Promise<ApiResponse<ReferralEarningsResponse>> => {
      return request<ReferralEarningsResponse>('/referrals/earnings');
    }
  }
};