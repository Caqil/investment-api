"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RecentUsers } from "../../components/dashboard/recent-users";
import { RecentTransactions } from "../../components/dashboard/recent-transactions";
import { RecentWithdrawals } from "../../components/dashboard/recent-withdrawals";
import { Overview } from "../../components/dashboard/overview-cards";
import { KYCStats } from "../../components/dashboard/kyc-stats";
import { isAuthenticated } from "../../services/auth-service";
import { dashboardApi } from "../../lib/api";
import { DashboardStats } from "../../types/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // For testing without a working API, you can comment this and use mock data below
        const data = await dashboardApi.getStats();
        setStats(data);

        /* Mock data for testing
        setStats({
          totalUsers: 256,
          activeUsers: 187,
          totalBalance: 458700.25,
          totalDeposits: 675800.50,
          totalWithdrawals: 217100.25,
          pendingWithdrawals: 8,
          pendingKYC: 12,
          kycApprovalRate: 83.5,
          recentUsers: [],
          recentWithdrawals: []
        });
        */
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError("Failed to load dashboard data. Please try again later.");

        // For development, set mock data when the API fails
        setStats({
          totalUsers: 256,
          activeUsers: 187,
          totalBalance: 458700.25,
          totalDeposits: 675800.5,
          totalWithdrawals: 217100.25,
          pendingWithdrawals: 8,
          pendingKYC: 12,
          kycApprovalRate: 83.5,
          recentUsers: [],
          recentWithdrawals: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {stats && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(stats.totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  across all user accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingWithdrawals}
                </div>
                <p className="text-xs text-muted-foreground">
                  withdrawal requests to process
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending KYC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingKYC}</div>
                <p className="text-xs text-muted-foreground">
                  verification requests waiting
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Overview
                totalDeposits={stats.totalDeposits}
                totalWithdrawals={stats.totalWithdrawals}
              />
            </div>
            <div>
              <KYCStats
                pendingCount={stats.pendingKYC}
                approvalRate={stats.kycApprovalRate}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <RecentUsers users={stats.recentUsers || []} />
            </div>
            <div className="lg:col-span-2">
              <RecentWithdrawals withdrawals={stats.recentWithdrawals || []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
