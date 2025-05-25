"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/transaction";
import {
  ArrowDown,
  ArrowUp,
  Gift,
  ChevronRight,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

interface RecentTransactionsProps {
  transactions?: Transaction[];
  loading?: boolean;
  showUser?: boolean;
  userId?: number;
  limit?: number;
  showRefreshButton?: boolean;
}

export function RecentTransactions({
  transactions: initialTransactions,
  loading: initialLoading = false,
  showUser = false,
  userId,
  limit = 5,
  showRefreshButton = false,
}: RecentTransactionsProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions || []
  );
  const [loading, setLoading] = useState<boolean>(
    initialLoading || !initialTransactions
  );
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Fetch transactions if not provided as props
  const fetchTransactions = async () => {
    if (initialTransactions && !showRefreshButton) return;

    setLoading(true);
    setError(null);

    try {
      let response;

      if (userId) {
        // Fetch transactions for a specific user
        response = await api.transactions.getByUserId(userId);
      } else {
        // Fetch recent transactions
        response = await api.transactions.getRecentTransactions(limit);
      }

      if (response.error) {
        setError(response.error);
        return;
      }

      // First check if data exists and is an object
      if (
        response.data &&
        typeof response.data === "object" &&
        "transactions" in response.data
      ) {
        setTransactions(response.data.transactions || []);
      } else {
        setTransactions([]);
        console.warn(
          "API response didn't include expected 'transactions' property:",
          response.data
        );
      }
    } catch (err) {
      setError("Failed to load transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users if showing user info
  const fetchUsers = async () => {
    if (!showUser) return;

    try {
      const response = await api.users.getAll();

      if (response.error) {
        console.error("Error fetching users:", response.error);
        return;
      }

      // Check if data exists and is an object
      if (
        response.data &&
        typeof response.data === "object" &&
        "users" in response.data
      ) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, [userId, limit]);

  // Helper to get user name from user ID
  const getUserName = (userId: number | undefined) => {
    if (!userId) return "Unknown User";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Helper to get transaction icon
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case TransactionType.WITHDRAWAL:
        return <ArrowUp className="h-4 w-4 text-yellow-500" />;
      case TransactionType.BONUS:
        return <Gift className="h-4 w-4 text-blue-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper to get transaction status badge
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completed
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case TransactionStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest financial activity on the platform
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={fetchTransactions}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => router.push("/transactions")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.type.charAt(0).toUpperCase() +
                        transaction.type.slice(1)}
                      {showUser && transaction.user_id !== undefined && (
                        <span className="font-normal">
                          {" "}
                          by {getUserName(transaction.user_id)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      transaction.type === TransactionType.DEPOSIT ||
                      transaction.type === TransactionType.BONUS
                        ? "text-green-600"
                        : transaction.type === TransactionType.WITHDRAWAL
                        ? "text-yellow-600"
                        : ""
                    }`}
                  >
                    {transaction.type === TransactionType.WITHDRAWAL
                      ? "- "
                      : "+ "}
                    {formatCurrency(transaction.amount, "BDT")}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs text-muted-foreground">
              New transactions will appear here when they are processed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
