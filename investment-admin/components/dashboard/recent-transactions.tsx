// src/components/dashboard/recent-transactions.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/types/transaction";
import { User } from "@/types/auth";
import { formatDate, formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecentTransactionsProps {
  limit?: number;
  className?: string;
  // Add the new props
  transactions?: Transaction[];
  loading?: boolean;
  showUser?: boolean;
  users?: User[];
  title?: string;
}

export function RecentTransactions({
  limit = 5,
  className,
  transactions: externalTransactions,
  loading: externalLoading,
  showUser = false,
  users = [],
  title = "Recent Transactions",
}: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only fetch transactions if they're not provided externally
  useEffect(() => {
    if (externalTransactions) {
      setTransactions(externalTransactions.slice(0, limit));
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.transactions.getAll();

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data?.transactions) {
          // Sort by date (newest first) and limit
          const sortedTransactions = [...response.data.transactions]
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, limit);

          setTransactions(sortedTransactions);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load transactions"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [limit, externalTransactions]);

  // Helper function to get user by ID
  const getUserById = (userId: number): User | undefined => {
    return users.find((user) => user.id === userId);
  };

  // Helper function to get badge variant based on transaction type
  const getTypeBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "success";
      case TransactionType.WITHDRAWAL:
        return "warning";
      case TransactionType.BONUS:
        return "secondary";
      case TransactionType.REFERRAL_BONUS:
        return "info";
      case TransactionType.PLAN_PURCHASE:
        return "destructive";
      case TransactionType.REFERRAL_PROFIT:
        return "default";
      default:
        return "secondary";
    }
  };

  // Helper function to get badge variant based on transaction status
  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "success";
      case TransactionStatus.PENDING:
        return "warning";
      case TransactionStatus.REJECTED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Use external loading state if provided
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                {showUser && <Skeleton className="h-10 w-10 rounded-full" />}
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="space-y-5">
            {transactions.map((transaction) => {
              const user = showUser
                ? getUserById(transaction.user_id)
                : undefined;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  {showUser && user && (
                    <Avatar>
                      <AvatarImage src={user.profile_pic_url} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {showUser && user && (
                        <span className="font-medium">{user.name}</span>
                      )}
                      <Badge variant={getTypeBadgeVariant(transaction.type)}>
                        {transaction.type}
                      </Badge>
                      <Badge
                        variant={getStatusBadgeVariant(transaction.status)}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description ||
                        `Transaction #${transaction.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        transaction.type === TransactionType.WITHDRAWAL
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {transaction.type === TransactionType.WITHDRAWAL
                        ? "-"
                        : "+"}
                      {formatCurrency(transaction.amount, "BDT")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
