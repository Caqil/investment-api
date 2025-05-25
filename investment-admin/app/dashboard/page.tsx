"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import DashboardCharts from "@/components/dashboard/dashboard-charts";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionStatus, TransactionType } from "@/types/transaction";
import { PendingActions } from "@/components/dashboard/pending-action";
import { RecentUsers } from "@/components/users/recen-user";

export default function DashboardPage() {
  const {
    totalUsers,
    activeUsers,
    pendingWithdrawals,
    pendingKyc,
    planDistribution,
    recentUsers,
    recentWithdrawals,
    isLoading,
    error,
  } = useDashboardStats();

  const {
    activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useRecentActivity();

  // Mock transactions for demonstration
  const mockTransactions = [
    {
      id: 1,
      user_id: recentUsers[0]?.id,
      amount: 1000,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.COMPLETED,
      description: "Initial deposit",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      user_id: recentUsers[1]?.id,
      amount: 500,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
      description: "Withdrawal request",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      user_id: recentUsers[0]?.id,
      amount: 50,
      type: TransactionType.BONUS,
      status: TransactionStatus.COMPLETED,
      description: "Daily bonus",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      user_id: recentUsers[2]?.id,
      amount: 100,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.COMPLETED,
      description: "Manual deposit",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      user_id: recentUsers[1]?.id,
      amount: 200,
      type: TransactionType.BONUS,
      status: TransactionStatus.COMPLETED,
      description: "Referral bonus",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            `Last updated: ${new Date().toLocaleString()}`
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        <DashboardStats
          totalUsers={totalUsers}
          activeUsers={activeUsers}
          pendingWithdrawals={pendingWithdrawals}
          pendingKyc={pendingKyc}
          loading={isLoading}
        />

        <Separator />

        <DashboardCharts
          planDistribution={planDistribution}
          loading={isLoading}
        />

        {activitiesError && (
          <Alert variant="destructive">
            <AlertDescription>{activitiesError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <PendingActions
            pendingWithdrawals={pendingWithdrawals}
            pendingKyc={pendingKyc}
            pendingPayments={3} // Mock value for demonstration
            loading={isLoading}
          />
          <RecentTransactions
            transactions={mockTransactions}
            loading={isLoading}
            showUser={true}
            users={recentUsers}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentUsers users={recentUsers} loading={isLoading} />
          {/* You can add another component here if needed */}
        </div>
      </div>
    </DashboardShell>
  );
}
