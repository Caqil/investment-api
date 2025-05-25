// src/components/dashboard/recent-transactions.tsx
import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../../types/transaction";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Get transaction type badge variant
  const getTypeVariant = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return "default";
      case "withdrawal":
        return "secondary";
      case "bonus":
        return "secondary";
      case "referral_bonus":
        return "secondary";
      case "plan_purchase":
        return "outline";
      case "referral_profit":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
      case "pending":
        return "outline";
      case "completed":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Latest financial activities on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent transactions found
            </p>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between space-x-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "BDT",
                    }).format(transaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.description || transaction.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getTypeVariant(transaction.type)}>
                    {transaction.type.replace("_", " ")}
                  </Badge>
                  <Badge variant={getStatusVariant(transaction.status)}>
                    {transaction.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
