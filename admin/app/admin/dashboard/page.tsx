// app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/admin-api";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Users,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import { Overview } from "@/components/dashboard/overview-cards";
import { RecentUsers } from "@/components/dashboard/recent-users";
import { RecentWithdrawals } from "@/components/dashboard/recent-withdrawals";
import { KYCStats } from "@/components/dashboard/kyc-stats";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setIsLoading(true);
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError("Failed to load dashboard statistics");
        toast.error("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-6 w-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  // Fallback stats
  const displayStats = stats || {
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
    recentTransactions: [],
  };

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
            <RecentUsers users={displayStats.recentUsers} />
            <RecentWithdrawals withdrawals={displayStats.recentWithdrawals} />
            <KYCStats
              pendingCount={displayStats.pendingKYC}
              approvalRate={displayStats.kycApprovalRate}
            />
          </div>
        </TabsContent>

        {/* Other tabs */}
      </Tabs>
    </div>
  );
}
