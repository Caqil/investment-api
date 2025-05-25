// src/app/dashboard/page.tsx
"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    pendingWithdrawals: 0,
    loading: true,
  });

  // Simulate loading data - in a real app, you'd fetch this from your API
  useEffect(() => {
    // Simulating API call
    const timer = setTimeout(() => {
      setStats({
        totalUsers: 156,
        totalDeposits: 45600,
        pendingWithdrawals: 12,
        loading: false,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? "Loading..." : stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading
                ? "Loading..."
                : formatCurrency(stats.totalDeposits, "USD")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? "Loading..." : stats.pendingWithdrawals}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {stats.loading
                ? "Loading recent users..."
                : "No recent users to display."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending KYC Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {stats.loading
                ? "Loading pending KYC verifications..."
                : "No pending KYC verifications."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {stats.loading
              ? "Loading recent transactions..."
              : "No recent transactions to display."}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
