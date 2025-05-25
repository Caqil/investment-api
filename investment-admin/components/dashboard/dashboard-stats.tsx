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

interface DashboardStatsProps {
  totalUsers: number;
  activeUsers: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  loading: boolean;
}

export function DashboardStats({
  totalUsers,
  activeUsers,
  pendingWithdrawals,
  pendingKyc,
  loading,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={totalUsers}
        icon={<User className="h-4 w-4" />}
        loading={loading}
      />

      <StatsCard
        title="Active Users"
        value={activeUsers}
        description={`${Math.round(
          (activeUsers / totalUsers) * 100
        )}% of total`}
        icon={<UserCheck className="h-4 w-4" />}
        loading={loading}
        trend={activeUsers > 0 ? "up" : "neutral"}
      />

      <StatsCard
        title="Pending Withdrawals"
        value={pendingWithdrawals}
        icon={<CreditCard className="h-4 w-4" />}
        loading={loading}
      />

      <StatsCard
        title="Pending KYC"
        value={pendingKyc}
        icon={<ShieldAlert className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
