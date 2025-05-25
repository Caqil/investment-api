export interface Plan {
    id: number;
    name: string;
    daily_deposit_limit: number;
    daily_withdrawal_limit: number;
    daily_profit_limit: number;
    price: number;
    is_default: boolean;
    created_at: string;
  }