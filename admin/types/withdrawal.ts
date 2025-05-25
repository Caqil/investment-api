
// src/types/withdrawal.ts
export type WithdrawalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected';

export type PaymentDetails = Record<string, any>;

export type Withdrawal = {
  id: number;
  transaction_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  payment_details: PaymentDetails;
  status: WithdrawalStatus;
  admin_note?: string;
  tasks_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type WithdrawalResponse = {
  id: number;
  amount: number;
  payment_method: string;
  payment_details: PaymentDetails;
  status: WithdrawalStatus;
  admin_note?: string;
  tasks_completed: boolean;
  created_at: string;
};
