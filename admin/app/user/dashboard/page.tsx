// app/user/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UserTransactionList } from "@/components/user/transaction-list";
import { UserTaskList } from "@/components/user/task-list";
import { ReferralStats } from "@/components/user/referral-stats";
import { useAuth } from "@/providers/auth-provider";
import { userApi } from "@/lib/user-api";
import { toast } from "sonner";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Wallet,
  TrendingUp,
  User,
  ArrowDownUp,
} from "lucide-react";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalProfit: number;
    totalReferrals: number;
  }>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalProfit: 0,
    totalReferrals: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        // Fetch transactions
        const transactionsResponse = await userApi.getTransactions();
        setTransactions(transactionsResponse.data.transactions || []);

        // Fetch tasks
        const tasksResponse = await userApi.getTasks();
        setTasks(tasksResponse.data.tasks || []);

        // Fetch KYC status
        const kycResponse = await userApi.getKYCStatus();
        setKycStatus(
          kycResponse.data.kyc_submitted
            ? kycResponse.data.kyc.status
            : "not_submitted"
        );

        // Fetch statistics
        const statsResponse = await userApi.getDashboardStats();
        if (statsResponse.data) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load some dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Calculate task completion
  const completedTasks = tasks.filter((task) => task.is_completed).length;
  const totalTasks = tasks.length;
  const taskCompletionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine if withdrawals are enabled based on task completion
  const withdrawalsEnabled = completedTasks === totalTasks && totalTasks > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button asChild size="sm">
            <Link href="/user/deposit">
              <Plus className="mr-2 h-4 w-4" />
              Deposit
            </Link>
          </Button>
          <Button
            asChild
            variant={withdrawalsEnabled ? "default" : "outline"}
            size="sm"
            disabled={!withdrawalsEnabled}
          >
            <Link href={withdrawalsEnabled ? "/user/withdraw" : "#"}>
              <Wallet className="mr-2 h-4 w-4" />
              Withdraw
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(user?.balance || 0)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Updated in real-time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(stats.totalProfit)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Including bonuses and referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg font-medium ${
                kycStatus === "approved" ? "text-green-600" : "text-amber-600"
              }`}
            >
              {kycStatus === "approved" && "Verified ✓"}
              {kycStatus === "pending" && "Pending Approval"}
              {kycStatus === "rejected" && "Verification Failed"}
              {kycStatus === "not_submitted" && "Not Verified"}
            </div>
            <div className="mt-2">
              {kycStatus !== "approved" && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/user/kyc">
                    {kycStatus === "not_submitted"
                      ? "Submit KYC"
                      : "View Status"}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Task Completion
            </CardTitle>
            <CheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {completedTasks} of {totalTasks} tasks
            </div>
            <Progress value={taskCompletionPercentage} className="mt-2" />
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/user/tasks">View Tasks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest financial activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTransactionList
                transactions={transactions.slice(0, 5)}
                isLoading={isLoading}
              />
              {transactions.length > 5 && (
                <Button asChild variant="ghost" className="mt-4 w-full">
                  <Link href="/user/transactions">View All Transactions</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>
                Complete tasks to enable withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTaskList
                tasks={tasks.slice(0, 5)}
                isLoading={isLoading}
                onComplete={(taskId) => {
                  // Update the tasks array when a task is completed
                  setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                      task.id === taskId
                        ? { ...task, is_completed: true }
                        : task
                    )
                  );
                }}
              />
              {tasks.length > 5 && (
                <Button asChild variant="ghost" className="mt-4 w-full">
                  <Link href="/user/tasks">View All Tasks</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
                <CardDescription>Your financial summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Deposits</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "BDT",
                      }).format(stats.totalDeposits)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Total Withdrawals
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "BDT",
                      }).format(stats.totalWithdrawals)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Profit</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "BDT",
                      }).format(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ROI</span>
                    <span className="font-medium text-green-600">
                      {stats.totalDeposits > 0
                        ? `${(
                            (stats.totalProfit / stats.totalDeposits) *
                            100
                          ).toFixed(2)}%`
                        : "0.00%"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
                <CardDescription>Your account overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account Level</span>
                    <span className="font-medium">
                      {user?.plan_id === 1
                        ? "Free"
                        : user?.plan_id === 2
                        ? "Silver"
                        : user?.plan_id === 3
                        ? "Gold"
                        : user?.plan_id === 4
                        ? "Platinum"
                        : "Diamond"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">KYC Status</span>
                    <span
                      className={`font-medium ${
                        kycStatus === "approved"
                          ? "text-green-600"
                          : kycStatus === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {kycStatus === "approved"
                        ? "Verified"
                        : kycStatus === "pending"
                        ? "Pending"
                        : kycStatus === "rejected"
                        ? "Rejected"
                        : "Not Submitted"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Referrals</span>
                    <span className="font-medium">
                      {stats.totalReferrals} users
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="font-medium">
                      {new Date(
                        user?.created_at || Date.now()
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple Check icon component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
