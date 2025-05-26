"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CheckSquare,
  CircleDollarSign,
  BadgeCheck,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    referralCount: number;
    tasksCompleted: number;
  };
  isLoading: boolean;
  isKycVerified: boolean;
}

export function UserStatsCards({
  stats,
  isLoading,
  isKycVerified,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Deposits"
        value={stats.totalDeposits}
        icon={<ArrowDownLeft className="h-4 w-4 text-green-500" />}
        description="All time deposits"
        isLoading={isLoading}
      />
      <StatCard
        title="Total Withdrawals"
        value={stats.totalWithdrawals}
        icon={<ArrowUpRight className="h-4 w-4 text-amber-500" />}
        description="All time withdrawals"
        isLoading={isLoading}
      />
      <StatCard
        title="Referrals"
        value={stats.referralCount}
        icon={<Users className="h-4 w-4 text-blue-500" />}
        description="Total users referred"
        isLoading={isLoading}
      />
      <StatCard
        title="Tasks Completed"
        value={stats.tasksCompleted}
        icon={<CheckSquare className="h-4 w-4 text-indigo-500" />}
        description="Completed tasks"
        isLoading={isLoading}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  isLoading: boolean;
}

function StatCard({
  title,
  value,
  icon,
  description,
  isLoading,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <div className="h-7 w-20 bg-muted animate-pulse rounded"></div>
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function KycStatusCard({
  isVerified,
  isLoading,
}: {
  isVerified: boolean;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
        {isVerified ? (
          <BadgeCheck className="h-4 w-4 text-green-500" />
        ) : (
          <CircleDollarSign className="h-4 w-4 text-orange-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="font-medium">
          {isLoading ? (
            <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
          ) : isVerified ? (
            <span className="text-green-500">Verified</span>
          ) : (
            <span className="text-orange-500">Not Verified</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isVerified
            ? "Your account is fully verified"
            : "Complete KYC verification to unlock all features"}
        </p>
      </CardContent>
    </Card>
  );
}
