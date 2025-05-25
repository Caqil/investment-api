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
import { useAuth } from "@/providers/auth-provider";
import { userApi } from "@/lib/user-api";
import { toast } from "sonner";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
            <CardDescription>Current available balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(user?.balance || 0)}
            </div>
            <div className="mt-4 flex space-x-2">
              <Button asChild size="sm">
                <Link href="/user/deposit">
                  <Plus className="mr-2 h-4 w-4" />
                  Deposit
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/user/withdraw">
                  <Wallet className="mr-2 h-4 w-4" />
                  Withdraw
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
            <CardDescription>Account verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {kycStatus === "approved" && "Verified ✓"}
              {kycStatus === "pending" && "Pending Approval"}
              {kycStatus === "rejected" && "Verification Failed"}
              {kycStatus === "not_submitted" && "Not Verified"}
            </div>
            {kycStatus !== "approved" && (
              <Button asChild className="mt-4" size="sm">
                <Link href="/user/kyc">
                  <FileCheck className="mr-2 h-4 w-4" />
                  {kycStatus === "not_submitted" ? "Submit KYC" : "View Status"}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Task Completion
            </CardTitle>
            <CardDescription>Required for withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {completedTasks} of {totalTasks} tasks
            </div>
            <Progress value={taskCompletionPercentage} className="mt-2" />
            <Button asChild className="mt-4" size="sm">
              <Link href="/user/tasks">View Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
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
              <UserTaskList tasks={tasks.slice(0, 5)} isLoading={isLoading} />
              {tasks.length > 5 && (
                <Button asChild variant="ghost" className="mt-4 w-full">
                  <Link href="/user/tasks">View All Tasks</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
