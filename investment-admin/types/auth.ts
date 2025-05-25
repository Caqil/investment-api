// src/types/auth.ts
export interface LoginCredentials {
    email: string;
    password: string;
    device_id: string; // Added device_id property
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }
  
  export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    balance: number;
    referral_code: string;
    is_kyc_verified: boolean;
    is_admin: boolean;
    is_blocked: boolean;
    biometric_enabled: boolean;
    profile_pic_url?: string;
    created_at: string;
  }