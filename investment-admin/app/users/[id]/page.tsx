"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  DollarSign,
  Mail,
  Phone,
  CalendarDays,
  UserCheck,
  UserX,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { User } from "@/types/auth";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/transaction";
import { UserActionButtons } from "./user-action-buttons";

interface UserDetailProps {
  userId: number;
  initialUserData?: any;
}

export function UserDetail({ userId, initialUserData }: UserDetailProps) {
  const [userData, setUserData] = useState<any>(initialUserData || null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialUserData);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true);

  // Fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.users.getById(userId);

      if (response.error) {
        setError(response.error);
        return;
      }

      setUserData(response.data);
    } catch (err) {
      setError("Failed to load user details. Please try again.");
      console.error("Error fetching user details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user transactions
  const fetchTransactions = async () => {
    if (activeTab !== "transactions") return;

    setTransactionsLoading(true);

    try {
      const response = await api.transactions.getByUserId(userId);

      if (response.error) {
        console.error("Error fetching transactions:", response.error);
        return;
      }

      if (response.data && "transactions" in response.data) {
        setTransactions(response.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (!initialUserData) {
      fetchUserData();
    }
  }, [initialUserData, userId]);

  // Fetch transactions when tab changes
  useEffect(() => {
    fetchTransactions();
  }, [activeTab]);

  // Handle user update (block/unblock)
  const handleUserUpdate = (updatedUser: User) => {
    setUserData((prev: any) => ({
      ...prev,
      user: updatedUser,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !userData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load user details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error || "User not found"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = userData.user || userData;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage user details and activity</CardDescription>
          </div>
          <UserActionButtons user={user} onUserUpdate={handleUserUpdate} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profile_pic_url || undefined} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user.phone || "Not provided"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {user.is_admin && <Badge>Admin</Badge>}
              {user.is_blocked ? (
                <Badge variant="destructive">Blocked</Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Active
                </Badge>
              )}
              {user.is_kyc_verified ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  KYC Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  KYC Pending
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Balance</span>
                </div>
                <span className="text-lg font-semibold">
                  {formatCurrency(user.balance, "BDT")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Plan</span>
                </div>
                <span className="text-lg font-semibold">
                  {userData.plan?.name || "Free Plan"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Joined</span>
                </div>
                <span className="text-lg font-semibold">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">User Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Referral Code
                    </p>
                    <p>{user.referral_code}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email Verified
                    </p>
                    <p>{user.email_verified ? "Yes" : "No"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Biometric Enabled
                    </p>
                    <p>{user.biometric_enabled ? "Yes" : "No"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Account Status
                    </p>
                    <p>{user.is_blocked ? "Blocked" : "Active"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Referral Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Referrals
                    </p>
                    <p>{userData.referral_count || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Referral Earnings
                    </p>
                    <p>
                      {formatCurrency(userData.referral_earnings || 0, "BDT")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            {transactionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          #{transaction.id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === TransactionType.DEPOSIT
                                ? "bg-green-50 text-green-700 border-green-200"
                                : transaction.type ===
                                  TransactionType.WITHDRAWAL
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.amount, "BDT")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === TransactionStatus.COMPLETED
                                ? "outline"
                                : transaction.status ===
                                  TransactionStatus.PENDING
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              transaction.status === TransactionStatus.COMPLETED
                                ? "bg-green-50 text-green-700 border-green-200"
                                : ""
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {formatDate(transaction.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No transactions found for this user.
              </div>
            )}
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            {userData.devices && userData.devices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Added Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userData.devices.map((device: any) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">
                          {device.device_id.substring(0, 10)}...
                        </TableCell>
                        <TableCell>
                          {device.device_name || "Unknown Device"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={device.is_active ? "outline" : "secondary"}
                            className={
                              device.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : ""
                            }
                          >
                            {device.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {device.last_login
                            ? formatDate(device.last_login)
                            : "Never"}
                        </TableCell>
                        <TableCell>{formatDate(device.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No devices found for this user.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
