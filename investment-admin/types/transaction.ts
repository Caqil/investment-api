export enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    BONUS = "bonus",
    REFERRAL_BONUS = "referral_bonus",
    PLAN_PURCHASE = "plan_purchase",
    REFERRAL_PROFIT = "referral_profit"
  }
  
  export enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    REJECTED = "rejected"
  }
  
  export interface Transaction {
    id: number;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    description?: string;
    created_at: string;
  }