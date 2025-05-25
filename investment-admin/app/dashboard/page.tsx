"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import DashboardCharts from "@/components/dashboard/dashboard-charts";
import { RecentActivity } from "@/components/dashboard/activity-list";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";

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

        <div className="grid gap-4 md:grid-cols-2">
          <RecentActivity
            activities={activities}
            loading={activitiesLoading}
            title="Recent Activity"
            description="Latest user actions across the platform"
          />

          <div className="grid gap-4">
            <RecentActivity
              activities={activities.filter((a) => a.type === "withdraw")}
              loading={activitiesLoading}
              title="Recent Withdrawals"
              description="Latest withdrawal requests"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
