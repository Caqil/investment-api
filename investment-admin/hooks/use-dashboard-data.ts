// src/hooks/use-dashboard-data.ts
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Dashboard stats types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  planDistribution: { name: string; value: number }[];
  recentUsers: any[];
  recentWithdrawals: any[];
  isLoading: boolean;
  error: string | null;
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
        // Fetch users
        const usersResponse = await api.users.getAll();
        if (usersResponse.error) {
          throw new Error(usersResponse.error);
        }
        
        const users = usersResponse.data?.users || [];
        const totalUsers = users.length;
        const activeUsers = users.filter(user => !user.is_blocked).length;
        
        // Sort users by creation date (newest first) and take the first 5
        const recentUsers = [...users]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // Fetch withdrawals
        const withdrawalsResponse = await api.withdrawals.getPending();
        if (withdrawalsResponse.error) {
          throw new Error(withdrawalsResponse.error);
        }
        
        const withdrawals = withdrawalsResponse.data?.withdrawals || [];
        const pendingWithdrawals = withdrawals.length;
        
        // Sort withdrawals by creation date (newest first) and take the first 5
        const recentWithdrawals = [...withdrawals]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // Fetch KYC data
        const kycResponse = await api.kyc.getPending();
        if (kycResponse.error) {
          throw new Error(kycResponse.error);
        }
        
        const pendingKyc = (kycResponse.data?.kyc_documents || []).length;
        
        // Fetch plans
        const plansResponse = await api.plans.getAll();
        if (plansResponse.error) {
          throw new Error(plansResponse.error);
        }
        
        const plans = plansResponse.data?.plans || [];
        
        // Calculate plan distribution
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
        
        const planDistribution = Object.entries(planCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        // Calculate total deposits (from recent transactions)
        // For now, let's use a placeholder
        const totalDeposits = 0; // This would ideally come from a real API call
        
        setStats({
          totalUsers,
          activeUsers,
          totalDeposits,
          pendingWithdrawals,
          pendingKyc,
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
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [usersResponse, withdrawalsResponse, kycResponse] = await Promise.all([
          api.users.getAll(),
          api.withdrawals.getAll(),
          api.kyc.getAll()
        ]);

        if (usersResponse.error) throw new Error(usersResponse.error);
        if (withdrawalsResponse.error) throw new Error(withdrawalsResponse.error);
        if (kycResponse.error) throw new Error(kycResponse.error);

        const users = usersResponse.data?.users || [];
        const withdrawals = withdrawalsResponse.data?.withdrawals || [];
        const kycDocs = kycResponse.data?.kyc_documents || [];

        // Create activity items
        const activityItems: any[] = [];
        
        // Add user join activities
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
        
        // Add withdrawal activities
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
              details: `requested a withdrawal of ${withdrawal.amount}`,
              amount: withdrawal.amount
            });
          }
        });
        
        // Add KYC activities
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
        
        // Sort by timestamp (newest first)
        const sortedActivities = activityItems.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setActivities(sortedActivities.slice(0, 10));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load activity data');
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, []);

  return { activities, isLoading, error };
}

// Hook to get transaction data by type and time period
export function useTransactionData(type: string, period: string) {
  const [data, setData] = useState<{ name: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, you would call an API endpoint like:
        // const response = await api.transactions.getByTypeAndPeriod(type, period);
        
        // For now, let's create an empty dataset since we don't have this endpoint
        const emptyData = [];
        
        if (period === 'daily') {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          for (const day of days) {
            emptyData.push({ name: day, amount: 0 });
          }
        } else if (period === 'weekly') {
          for (let i = 1; i <= 4; i++) {
            emptyData.push({ name: `Week ${i}`, amount: 0 });
          }
        } else if (period === 'monthly') {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          for (const month of months) {
            emptyData.push({ name: month, amount: 0 });
          }
        }
        
        setData(emptyData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching transaction data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load transaction data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type, period]);

  return { data, isLoading, error };
}