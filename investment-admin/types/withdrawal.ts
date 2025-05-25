/* eslint-disable @typescript-eslint/no-explicit-any */
export enum WithdrawalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
  }
  
  export interface PaymentDetails {
    [key: string]: any;
  }
  
  export interface Withdrawal {
    id: number;
    user_id: number;
    amount: number;
    payment_method: string;
    payment_details: PaymentDetails;
    status: WithdrawalStatus;
    admin_note?: string;
    tasks_completed: boolean;
    created_at: string;
  }