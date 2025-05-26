// src/hooks/use-dashboard-data.ts
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
// Extend the User type from auth with additional properties needed for dashboard
import { User as BaseUser } from '@/types/auth';

// Extended User interface with additional properties
interface User extends BaseUser {
  plan_id: number;
  is_blocked: boolean;
  profile_pic_url?: string;
}

import { Plan } from '@/types/plan';
import { Withdrawal } from '@/types/withdrawal';
import { KYCDocument } from '@/types/kyc';
import { Transaction } from '@/types/transaction';

// API response interfaces
interface UsersResponse {
  users: User[];
}

interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
}

interface KYCResponse {
  kyc_documents: KYCDocument[];
}

interface PlansResponse {
  plans: Plan[];
}

interface TransactionsResponse {
  transactions: Transaction[];
}

// Dashboard stats response from API
interface DashboardStatsResponse {
  users_count: number;
  active_users_count: number;
  pending_withdrawals_count: number;
  pending_kyc_count: number;
}

// Dashboard stats types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  planDistribution: { name: string; value: number }[];
  recentUsers: User[];
  recentWithdrawals: Withdrawal[];
  isLoading: boolean;
  error: string | null;
}

// Activity item type
export interface ActivityItem {
  id: string;
  type: 'join' | 'deposit' | 'withdraw' | 'kyc' | 'plan';
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  details: string;
  amount?: number;
}

// Default empty stats
const defaultStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalDeposits: 0,
  pendingWithdrawals: 0,
  pendingKyc: 0,
  planDistribution: [],
  recentUsers: [],
  recentWithdrawals: [],
  isLoading: true,
  error: null
};

// Hook to get all dashboard stats
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch core dashboard statistics from dedicated endpoint
        const statsResponse = await api.dashboard.getStats();
        
        let coreStats = {
          totalUsers: 0,
          activeUsers: 0,
          pendingWithdrawals: 0,
          pendingKyc: 0
        };

        if (statsResponse.error) {
          console.warn('Dashboard stats endpoint failed, falling back to individual calls:', statsResponse.error);
          
          // Fallback: fetch users data to calculate stats
          const usersResponse = await api.users.getAll();
          if (!usersResponse.error && usersResponse.data) {
            const users = (usersResponse.data as UsersResponse)?.users || [];
            coreStats.totalUsers = users.length;
            coreStats.activeUsers = users.filter(user => !user.is_blocked).length;
          }

          // Fallback: fetch pending withdrawals
          const withdrawalsResponse = await api.withdrawals.getPending();
          if (!withdrawalsResponse.error && withdrawalsResponse.data) {
            const withdrawals = (withdrawalsResponse.data as WithdrawalsResponse)?.withdrawals || [];
            coreStats.pendingWithdrawals = withdrawals.length;
          }

          // Fallback: fetch pending KYC
          const kycResponse = await api.kyc.getPending();
          if (!kycResponse.error && kycResponse.data) {
            const kycDocs = (kycResponse.data as KYCResponse)?.kyc_documents || [];
            coreStats.pendingKyc = kycDocs.length;
          }
        } else if (statsResponse.data) {
          // Use data from dedicated stats endpoint
          const data = statsResponse.data as unknown as DashboardStatsResponse;
          coreStats = {
            totalUsers: data.users_count || 0,
            activeUsers: data.active_users_count || 0,
            pendingWithdrawals: data.pending_withdrawals_count || 0,
            pendingKyc: data.pending_kyc_count || 0
          };
        }

        // Fetch additional data for dashboard
        const [usersResponse, withdrawalsResponse, plansResponse] = await Promise.allSettled([
          api.users.getAll(),
          api.withdrawals.getAll(),
          api.plans.getAll()
        ]);

        // Process users data
        let recentUsers: User[] = [];
        let planDistribution: { name: string; value: number }[] = [];
        
        if (usersResponse.status === 'fulfilled' && !usersResponse.value.error && usersResponse.value.data) {
          const users = (usersResponse.value.data as UsersResponse)?.users || [];
          
          // Get recent users (newest first, limit to 5)
          recentUsers = [...users]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

          // Calculate plan distribution if we have plans data
          if (plansResponse.status === 'fulfilled' && !plansResponse.value.error && plansResponse.value.data) {
            const plans = (plansResponse.value.data as PlansResponse)?.plans || [];
            
            const planCounts: Record<string, number> = {};
            plans.forEach(plan => {
              planCounts[plan.name] = 0;
            });
            
            users.forEach(user => {
              const userPlan = plans.find(plan => plan.id === user.plan_id);
              if (userPlan) {
                planCounts[userPlan.name] = (planCounts[userPlan.name] || 0) + 1;
              }
            });
            
            planDistribution = Object.entries(planCounts)
              .map(([name, value]) => ({ name, value }))
              .filter(item => item.value > 0); // Only include plans with users
          }
        }

        // Process withdrawals data
        let recentWithdrawals: Withdrawal[] = [];
        if (withdrawalsResponse.status === 'fulfilled' && !withdrawalsResponse.value.error && withdrawalsResponse.value.data) {
          const withdrawals = (withdrawalsResponse.value.data as WithdrawalsResponse)?.withdrawals || [];
          
          // Get recent withdrawals (newest first, limit to 5)
          recentWithdrawals = [...withdrawals]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
        }

        // Calculate total deposits from recent transactions
        let totalDeposits = 0;
        try {
          const transactionsResponse = await api.transactions.getAll();
          if (!transactionsResponse.error && transactionsResponse.data) {
            const transactions = (transactionsResponse.data as TransactionsResponse)?.transactions || [];
            totalDeposits = transactions
              .filter(t => t.type === 'deposit' && t.status === 'completed')
              .reduce((sum, t) => sum + t.amount, 0);
          }
        } catch (error) {
          console.warn('Failed to fetch transactions for total deposits:', error);
        }

        // Update state with all collected data
        setStats({
          totalUsers: coreStats.totalUsers,
          activeUsers: coreStats.activeUsers,
          totalDeposits,
          pendingWithdrawals: coreStats.pendingWithdrawals,
          pendingKyc: coreStats.pendingKyc,
          planDistribution,
          recentUsers,
          recentWithdrawals,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats({
          ...defaultStats,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data'
        });
      }
    };

    fetchStats();
  }, []);

  return stats;
}

// Hook to get recent activity data
export function useRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [usersResponse, withdrawalsResponse, kycResponse] = await Promise.allSettled([
          api.users.getAll(),
          api.withdrawals.getAll(),
          api.kyc.getAll()
        ]);

        const activityItems: ActivityItem[] = [];
        
        // Process users for join activities
        if (usersResponse.status === 'fulfilled' && !usersResponse.value.error && usersResponse.value.data) {
          const users = (usersResponse.value.data as UsersResponse)?.users || [];
          
          users.slice(0, 10).forEach(user => {
            activityItems.push({
              id: `user-${user.id}`,
              type: 'join',
              user: {
                name: user.name,
                email: user.email,
                avatar: user.profile_pic_url
              },
              timestamp: user.created_at,
              details: 'joined the platform'
            });
          });
        }
        
        // Process withdrawals for withdrawal activities
        if (withdrawalsResponse.status === 'fulfilled' && !withdrawalsResponse.value.error && withdrawalsResponse.value.data) {
          const withdrawals = (withdrawalsResponse.value.data as WithdrawalsResponse)?.withdrawals || [];
          const users = usersResponse.status === 'fulfilled' && usersResponse.value.data ? 
            (usersResponse.value.data as UsersResponse)?.users || [] : [];
          
          withdrawals.slice(0, 10).forEach(withdrawal => {
            const user = users.find(u => u.id === withdrawal.user_id);
            if (user) {
              activityItems.push({
                id: `withdrawal-${withdrawal.id}`,
                type: 'withdraw',
                user: {
                  name: user.name,
                  email: user.email,
                  avatar: user.profile_pic_url
                },
                timestamp: withdrawal.created_at,
                details: `requested a withdrawal of ${withdrawal.amount} BDT`,
                amount: withdrawal.amount
              });
            }
          });
        }
        
        // Process KYC for verification activities
        if (kycResponse.status === 'fulfilled' && !kycResponse.value.error && kycResponse.value.data) {
          const kycDocs = (kycResponse.value.data as KYCResponse)?.kyc_documents || [];
          const users = usersResponse.status === 'fulfilled' && usersResponse.value.data ? 
            (usersResponse.value.data as UsersResponse)?.users || [] : [];
          
          kycDocs.slice(0, 10).forEach(doc => {
            const user = users.find(u => u.id === doc.user_id);
            if (user) {
              activityItems.push({
                id: `kyc-${doc.id}`,
                type: 'kyc',
                user: {
                  name: user.name,
                  email: user.email,
                  avatar: user.profile_pic_url
                },
                timestamp: doc.created_at,
                details: `submitted KYC verification (${doc.status})`
              });
            }
          });
        }
        
        // Sort by timestamp (newest first) and limit to 10
        const sortedActivities = activityItems
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        
        setActivities(sortedActivities);
        
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load activity data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, []);

  return { activities, isLoading, error };
}

// Interface for transaction data
interface TransactionData {
  name: string; 
  amount: number;
}

// Hook to get transaction data by type and time period
export function useTransactionData(type: string, period: string) {
  const [data, setData] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch transactions from API
        const response = await api.transactions.getAll();
        
        if (response.error) {
          throw new Error(response.error);
        }

        const transactions = response.data ? (response.data as TransactionsResponse)?.transactions || [] : [];
        
        // Filter transactions by type
        const filteredTransactions = transactions.filter(t => 
          t.type === type && t.status === 'completed'
        );

        // Group and aggregate data by time period
        const groupedData: Record<string, number> = {};
        
        if (period === 'daily') {
          // Group by day of week
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          days.forEach(day => groupedData[day] = 0);
          
          filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const dayName = days[date.getDay()];
            groupedData[dayName] += transaction.amount;
          });
          
        } else if (period === 'weekly') {
          // Group by week (last 4 weeks)
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            groupedData[`Week ${4 - i}`] = 0;
          }
          
          filteredTransactions.forEach(transaction => {
            const transactionDate = new Date(transaction.created_at);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
            const weekIndex = Math.floor(daysDiff / 7);
            
            if (weekIndex < 4) {
              groupedData[`Week ${4 - weekIndex}`] += transaction.amount;
            }
          });
          
        } else if (period === 'monthly') {
          // Group by month (last 6 months)
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const now = new Date();
          
          for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[monthDate.getMonth()];
            groupedData[monthName] = 0;
          }
          
          filteredTransactions.forEach(transaction => {
            const transactionDate = new Date(transaction.created_at);
            const monthName = months[transactionDate.getMonth()];
            if (groupedData.hasOwnProperty(monthName)) {
              groupedData[monthName] += transaction.amount;
            }
          });
        }

        // Convert to array format expected by charts
        const chartData = Object.entries(groupedData).map(([name, amount]) => ({
          name,
          amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
        }));
        
        setData(chartData);
        
      } catch (error) {
        console.error('Error fetching transaction data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load transaction data');
        
        // Fallback to empty data structure
        const emptyData: TransactionData[] = [];
        if (period === 'daily') {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          days.forEach(day => emptyData.push({ name: day, amount: 0 }));
        } else if (period === 'weekly') {
          for (let i = 1; i <= 4; i++) {
            emptyData.push({ name: `Week ${i}`, amount: 0 });
          }
        } else if (period === 'monthly') {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          months.forEach(month => emptyData.push({ name: month, amount: 0 }));
        }
        setData(emptyData);
        
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type, period]);

  return { data, isLoading, error };
}