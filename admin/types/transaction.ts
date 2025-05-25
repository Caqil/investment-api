
// src/types/transaction.ts
export type TransactionType = 
  | 'deposit'
  | 'withdrawal'
  | 'bonus'
  | 'referral_bonus'
  | 'plan_purchase'
  | 'referral_profit';

export type TransactionStatus = 
  | 'pending'
  | 'completed'
  | 'rejected';

export type Transaction = {
  id: number;
  user_id: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reference_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type TransactionResponse = {
  id: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  created_at: string;
};