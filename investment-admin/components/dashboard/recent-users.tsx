"use client";

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
} from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
  showUser?: boolean;
  users?: any[];
}

export function RecentTransactions({
  transactions,
  loading = false,
  showUser = false,
  users = [],
}: RecentTransactionsProps) {
  const router = useRouter();

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
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => router.push("/transactions")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
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
