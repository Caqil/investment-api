"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { format } from "date-fns";
import { BlockUserDialog } from "../../../../components/users/block-user-dialog";
import { Button } from "../../../../components/ui/button";
import { toast } from "sonner"; // Using Sonner instead of the deprecated toast
import { User } from "../../../../types/user";
import { Transaction } from "../../../../types/transaction";
import { Withdrawal } from "../../../../types/withdrawal";
import { usersApi } from "../../../../lib/api";

// Define the expected response type from the API
interface UserDetailResponse {
  user: User;
  transactions?: Transaction[];
  withdrawals?: Withdrawal[];
  devices?: any[];
  referral_count?: number;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        // Add type assertion here to fix the type issue
        const userData = (await usersApi.getById(userId)) as UserDetailResponse;
        setUser(userData.user);

        // Set transactions and withdrawals from the user data
        if (userData.transactions) {
          setTransactions(userData.transactions);
        }

        if (userData.withdrawals) {
          setWithdrawals(userData.withdrawals);
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Handle user block/unblock
  const handleBlockStatusChange = async (
    userId: number,
    isBlocked: boolean
  ) => {
    try {
      if (isBlocked) {
        await usersApi.unblock(userId);
        toast.success("User has been unblocked");
      } else {
        await usersApi.block(userId);
        toast.success("User has been blocked");
      }

      // Update user in state
      if (user) {
        setUser({ ...user, is_blocked: !isBlocked });
      }
    } catch (error) {
      console.error("Error updating user block status:", error);
      toast.error(`Failed to ${isBlocked ? "unblock" : "block"} user`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="animate-pulse">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Back
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-destructive">{error || "User not found"}</p>
              <Button onClick={() => router.push("/users")} className="mt-4">
                Go to Users List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Back
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
        </div>

        <BlockUserDialog
          user={user}
          onBlockStatusChange={handleBlockStatusChange}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Personal details and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profile_pic_url} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                  {user.name}
                  {user.is_kyc_verified && (
                    <Badge variant="secondary">Verified</Badge>
                  )}
                </h3>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-muted-foreground">{user.phone}</p>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  {user.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                  {user.is_admin && <Badge variant="default">Admin</Badge>}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Balance:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(user.balance)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Referral Code:</span>
                <span className="font-medium">{user.referral_code}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan ID:</span>
                <span className="font-medium">{user.plan_id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Verified:</span>
                <span className="font-medium">
                  {user.email_verified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Biometric Enabled:
                </span>
                <span className="font-medium">
                  {user.biometric_enabled ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">
                  {format(new Date(user.created_at), "PPP")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transactions" className="flex flex-col h-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="flex-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Recent transactions for this user
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No transactions found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center pb-4 border-b"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.type.charAt(0).toUpperCase() +
                              transaction.type.slice(1).replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), "PPp")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              transaction.type === "withdrawal"
                                ? "text-destructive"
                                : "text-green-600 dark:text-green-500"
                            }`}
                          >
                            {transaction.type === "withdrawal" ? "-" : "+"}
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "BDT",
                            }).format(transaction.amount)}
                          </p>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "pending"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="flex-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Recent withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {withdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No withdrawals found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.slice(0, 5).map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex justify-between items-center pb-4 border-b"
                      >
                        <div>
                          <p className="font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "BDT",
                            }).format(withdrawal.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.payment_method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(withdrawal.created_at), "PPp")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              withdrawal.status === "approved"
                                ? "default"
                                : withdrawal.status === "pending"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {withdrawal.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {withdrawal.admin_note
                              ? `Note: ${withdrawal.admin_note}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
