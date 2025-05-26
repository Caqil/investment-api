"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  User,
  CreditCard,
  Activity,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  change?: number;
  loading?: boolean;
  trend?: "up" | "down" | "neutral";
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  change,
  loading = false,
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}

        {(description || change !== undefined || trend) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === "up" && (
              <span className="flex items-center text-emerald-500">
                <ArrowUp className="h-3 w-3 mr-0.5" />
                {change !== undefined ? `${change}%` : ""}
              </span>
            )}
            {trend === "down" && (
              <span className="flex items-center text-rose-500">
                <ArrowDown className="h-3 w-3 mr-0.5" />
                {change !== undefined ? `${Math.abs(change)}%` : ""}
              </span>
            )}
            {description && (
              <span className={change !== undefined ? "mx-1" : ""}>
                {description}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  // State for statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingWithdrawals: 0,
    pendingKyc: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics from the API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the appropriate API endpoint to fetch the dashboard stats
        const response = await api.dashboard.getStats();

        if (response.error) {
          setError(response.error);
          return;
        }

        // Check if data exists and has the expected properties
        if (response.data) {
          const {
            users_count,
            active_users_count,
            pending_withdrawals_count,
            pending_kyc_count,
          } = response.data;

          setStats({
            totalUsers: users_count || 0,
            activeUsers: active_users_count || 0,
            pendingWithdrawals: pending_withdrawals_count || 0,
            pendingKyc: pending_kyc_count || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Calculate active users percentage, handling division by zero
  const activePercentage =
    stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0;

  // Create appropriate descriptions
  const activeUsersDescription =
    stats.totalUsers > 0
      ? `${activePercentage}% of total`
      : "No users registered yet";

  const pendingWithdrawalsDescription =
    stats.pendingWithdrawals > 0 ? "Awaiting approval" : "No pending requests";

  const pendingKycDescription =
    stats.pendingKyc > 0 ? "Awaiting verification" : "No pending verifications";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        description={
          stats.totalUsers > 0 ? "Registered accounts" : "No users yet"
        }
        icon={<User className="h-4 w-4" />}
        loading={loading}
      />

      <StatsCard
        title="Active Users"
        value={stats.activeUsers}
        description={activeUsersDescription}
        icon={<UserCheck className="h-4 w-4" />}
        loading={loading}
        trend={stats.activeUsers > 0 && stats.totalUsers > 0 ? "up" : "neutral"}
      />

      <StatsCard
        title="Pending Withdrawals"
        value={stats.pendingWithdrawals}
        description={pendingWithdrawalsDescription}
        icon={<CreditCard className="h-4 w-4" />}
        loading={loading}
        trend={stats.pendingWithdrawals > 0 ? "up" : "neutral"}
      />

      <StatsCard
        title="Pending KYC"
        value={stats.pendingKyc}
        description={pendingKycDescription}
        icon={<ShieldAlert className="h-4 w-4" />}
        loading={loading}
        trend={stats.pendingKyc > 0 ? "up" : "neutral"}
      />

      {error && (
        <div className="col-span-full p-3 mt-2 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
