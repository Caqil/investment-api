import { User } from "./user";
import { Withdrawal } from "./withdrawal";

// src/types/dashboard.ts
export type DashboardStats = {
    totalUsers: number;
    activeUsers: number;
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    pendingKYC: number;
    kycApprovalRate: number;
    recentUsers: User[];
    recentWithdrawals: Withdrawal[];
  };