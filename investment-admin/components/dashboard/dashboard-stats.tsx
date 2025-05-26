"use client";

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
import { useDashboardStats } from "@/hooks/use-dashboard-data";

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
  // Use the hook from use-dashboard-data.ts
  const {
    totalUsers,
    activeUsers,
    pendingWithdrawals,
    pendingKyc,
    isLoading,
    error,
  } = useDashboardStats();

  // Calculate active users percentage, handling division by zero
  const activePercentage =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  // Create appropriate descriptions
  const activeUsersDescription =
    totalUsers > 0
      ? `${activePercentage}% of total`
      : "No users registered yet";

  const pendingWithdrawalsDescription =
    pendingWithdrawals > 0 ? "Awaiting approval" : "No pending requests";

  const pendingKycDescription =
    pendingKyc > 0 ? "Awaiting verification" : "No pending verifications";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={totalUsers}
        description={totalUsers > 0 ? "Registered accounts" : "No users yet"}
        icon={<User className="h-4 w-4" />}
        loading={isLoading}
      />

      <StatsCard
        title="Active Users"
        value={activeUsers}
        description={activeUsersDescription}
        icon={<UserCheck className="h-4 w-4" />}
        loading={isLoading}
        trend={activeUsers > 0 && totalUsers > 0 ? "up" : "neutral"}
      />

      <StatsCard
        title="Pending Withdrawals"
        value={pendingWithdrawals}
        description={pendingWithdrawalsDescription}
        icon={<CreditCard className="h-4 w-4" />}
        loading={isLoading}
        trend={pendingWithdrawals > 0 ? "up" : "neutral"}
      />

      <StatsCard
        title="Pending KYC"
        value={pendingKyc}
        description={pendingKycDescription}
        icon={<ShieldAlert className="h-4 w-4" />}
        loading={isLoading}
        trend={pendingKyc > 0 ? "up" : "neutral"}
      />

      {error && (
        <div className="col-span-full p-3 mt-2 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
