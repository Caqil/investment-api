
// src/types/user.ts
export type User = {
    id: number;
    name: string;
    email: string;
    phone: string;
    balance: number;
    referral_code: string;
    referred_by?: number;
    plan_id: number;
    is_kyc_verified: boolean;
    email_verified: boolean;
    is_admin: boolean;
    is_blocked: boolean;
    biometric_enabled: boolean;
    profile_pic_url: string;
    created_at: string;
    updated_at: string;
  };
  
  export type UserResponse = {
    id: number;
    name: string;
    email: string;
    phone: string;
    balance: number;
    referral_code: string;
    is_kyc_verified: boolean;
    biometric_enabled: boolean;
    profile_pic_url: string;
    created_at: string;
  };