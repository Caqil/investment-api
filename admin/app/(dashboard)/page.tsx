"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentUsers } from "@/components/dashboard/recent-users";
import { RecentWithdrawals } from "@/components/dashboard/recent-withdrawals";
import { KYCStats } from "@/components/dashboard/kyc-stats";
import { dashboardApi } from "../../lib/api";
import { Overview } from "@/components/dashboard/overview-cards";
import { toast } from "sonner"; // Import toast from sonner if needed for error handling

// Dashboard stats interface
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  pendingKYC: number;
  kycApprovalRate: number;
  recentUsers: any[];
  recentWithdrawals: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        // Add type assertion here to fix potential type issues
        const data = (await dashboardApi.getStats()) as DashboardStats;
        setStats(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError("Failed to load dashboard data");
        // Use sonner toast for error notification if desired
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your investment platform
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-destructive">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <CardDescription>
                  Active users: {stats?.activeUsers || 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Balance
                </CardTitle>
                <CardDescription>All user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(stats?.totalBalance || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Withdrawals
                </CardTitle>
                <CardDescription>Awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.pendingWithdrawals || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending KYC
                </CardTitle>
                <CardDescription>
                  Approval rate: {stats?.kycApprovalRate || 0}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.pendingKYC || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recent-users">Recent Users</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Overview
                totalDeposits={stats?.totalDeposits || 0}
                totalWithdrawals={stats?.totalWithdrawals || 0}
              />
            </TabsContent>

            <TabsContent value="recent-users" className="space-y-4">
              <RecentUsers users={stats?.recentUsers || []} />
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
              <RecentWithdrawals withdrawals={stats?.recentWithdrawals || []} />
            </TabsContent>

            <TabsContent value="kyc" className="space-y-4">
              <KYCStats
                pendingCount={stats?.pendingKYC || 0}
                approvalRate={stats?.kycApprovalRate || 0}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
