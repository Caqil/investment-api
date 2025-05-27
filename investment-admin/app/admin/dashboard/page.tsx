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
import { PendingActions } from "@/components/dashboard/pending-action";
import { RecentUsers } from "@/components/users/recent-user";
import { api } from "@/lib/api";
import { Transaction } from "@/types/transaction";
import { SecuritySettings } from "@/components/settings/security-settings";
import { useSettings } from "@/hooks/use-settings";

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
  const { settings, loading, updateSetting } = useSettings();
  const systemSettings = settings.filter((s) => s.group === "system");
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Fetch recent transactions
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      setTransactionsLoading(true);

      try {
        const response = await api.transactions.getRecentTransactions(5);

        if (response.error) {
          console.error("Error fetching recent transactions:", response.error);
          setRecentTransactions([]);
          return;
        }

        // Check if data exists and has transactions property
        if (
          response.data &&
          typeof response.data === "object" &&
          "transactions" in response.data
        ) {
          setRecentTransactions(response.data.transactions || []);
        } else {
          setRecentTransactions([]);
          console.warn(
            "API response didn't include expected 'transactions' property:",
            response.data
          );
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setRecentTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

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
        <DashboardStats />

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
            pendingPayments={3} // This could also be fetched from API
            loading={isLoading}
          />
          <RecentTransactions
            transactions={recentTransactions}
            loading={isLoading || transactionsLoading}
            showUser={true}
            users={recentUsers}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentUsers users={recentUsers} loading={isLoading} />
        </div>
      </div>
    </DashboardShell>
  );
}
