// admin/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/overview-cards";
import { RecentUsers } from "@/components/dashboard/recent-users";
import { RecentWithdrawals } from "@/components/dashboard/recent-withdrawals";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { KYCStats } from "@/components/dashboard/kyc-stats";
import { dashboardApi } from "@/lib/api";
import { DashboardStats } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  Users,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  // Placeholder data if the API call fails
  const placeholderStats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    pendingKYC: 0,
    kycApprovalRate: 0,
    recentUsers: [],
    recentWithdrawals: [],
  };

  const displayStats = stats || placeholderStats;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayStats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayStats.activeUsers.toLocaleString()} active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(displayStats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all user accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Deposits
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(displayStats.totalDeposits)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time deposit volume
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Withdrawals
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayStats.pendingWithdrawals}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Overview
            totalDeposits={displayStats.totalDeposits}
            totalWithdrawals={displayStats.totalWithdrawals}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RecentUsers users={displayStats.recentUsers.slice(0, 5)} />
            <RecentWithdrawals
              withdrawals={displayStats.recentWithdrawals.slice(0, 5)}
            />
            <KYCStats
              pendingCount={displayStats.pendingKYC}
              approvalRate={displayStats.kycApprovalRate}
            />
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Detailed analytics coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Report generation coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
