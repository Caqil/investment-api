"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { userApi } from "@/lib/user-api";
import { User } from "@/types/auth";
import { Transaction } from "@/types/transaction";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { BalanceCard } from "@/components/user-dashboard/balance-card";
import { TasksOverview } from "@/components/user-dashboard/tasks-overview";
import { UserStatsCards } from "@/components/user-dashboard/user-stats";
import { RecentTransactions } from "@/components/user-dashboard/recent-transactions";

export default function UserDashboardPage() {
  // State for user data
  const [user, setUser] = useState<User | null>(null);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);

  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // State for KYC status
  const [isKycVerified, setIsKycVerified] = useState(false);

  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    referralCount: 0,
    tasksCompleted: 0,
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch profile data
        const profileResponse = await userApi.profile.getProfile();
        if (profileResponse.error) {
          throw new Error(profileResponse.error);
        }

        if (profileResponse.data) {
          setUser(profileResponse.data.user);
          setReferralEarnings(profileResponse.data.referral_earnings);
          setReferralCount(profileResponse.data.referral_count);
        }

        // Fetch referral code
        const referralResponse = await userApi.referrals.getEarnings();
        if (referralResponse.data) {
          setReferralCode(referralResponse.data.referral_code);
        }

        // Fetch KYC status
        const kycResponse = await userApi.kyc.getStatus();
        if (kycResponse.data) {
          setIsKycVerified(
            kycResponse.data.kyc_submitted &&
              kycResponse.data.kyc?.status === "approved"
          );
        }

        // Fetch transactions
        const transactionsResponse = await userApi.transactions.getAll();
        if (transactionsResponse.data) {
          setTransactions(transactionsResponse.data.transactions);

          // Calculate stats from transactions
          const deposits = transactionsResponse.data.transactions.filter(
            (t) => t.type === "deposit" && t.status === "completed"
          );
          const withdrawals = transactionsResponse.data.transactions.filter(
            (t) => t.type === "withdrawal" && t.status === "completed"
          );

          setStats((prev) => ({
            ...prev,
            totalDeposits: deposits.length,
            totalWithdrawals: withdrawals.length,
          }));
        }

        // Fetch tasks
        const tasksResponse = await userApi.tasks.getAll();
        if (tasksResponse.data) {
          setTasks(tasksResponse.data.tasks);

          // Count completed tasks
          const completedTasks = tasksResponse.data.tasks.filter(
            (t) => t.is_completed
          ).length;
          setStats((prev) => ({
            ...prev,
            tasksCompleted: completedTasks,
            referralCount: profileResponse.data?.referral_count || 0,
          }));
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <BalanceCard
          user={user}
          referralEarnings={referralEarnings}
          referralCode={referralCode}
          isLoading={isLoading}
        />

        <div className="md:col-span-1 lg:col-span-2">
          {!isKycVerified && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                    Complete KYC Verification
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                    Verify your identity to unlock withdrawals and higher
                    limits.
                  </p>
                </div>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => (window.location.href = "/user/kyc")}
                >
                  Verify Now
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <UserStatsCards
            stats={stats}
            isLoading={isLoading}
            isKycVerified={isKycVerified}
          />
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <TasksOverview tasks={tasks} isLoading={isLoading} limit={3} />

        <RecentTransactions
          transactions={transactions}
          isLoading={isLoading}
          limit={5}
        />
      </div>
    </div>
  );
}
