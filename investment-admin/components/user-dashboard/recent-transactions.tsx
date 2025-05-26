"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/types/transaction";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, Gift, CreditCard } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
  limit?: number;
}

export function RecentTransactions({
  transactions,
  isLoading,
  limit = 5,
}: RecentTransactionsProps) {
  const router = useRouter();
  const limitedTransactions = transactions.slice(0, limit);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case TransactionType.WITHDRAWAL:
        return <ArrowUpRight className="h-4 w-4 text-amber-500" />;
      case TransactionType.BONUS:
      case TransactionType.REFERRAL_BONUS:
      case TransactionType.REFERRAL_PROFIT:
        return <Gift className="h-4 w-4 text-blue-500" />;
      case TransactionType.PLAN_PURCHASE:
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Completed
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case TransactionStatus.REJECTED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your most recent transactions across all categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No transactions yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
              Your recent transactions will appear here once you make deposits
              or withdrawals.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {limitedTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">
                      {transaction.type.replace(/_/g, " ")}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {transaction.description ||
                      formatDate(transaction.created_at)}
                  </p>
                </div>
                <div
                  className={`font-medium ${
                    transaction.type === TransactionType.DEPOSIT ||
                    transaction.type === TransactionType.BONUS ||
                    transaction.type === TransactionType.REFERRAL_BONUS ||
                    transaction.type === TransactionType.REFERRAL_PROFIT
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === TransactionType.DEPOSIT ||
                  transaction.type === TransactionType.BONUS ||
                  transaction.type === TransactionType.REFERRAL_BONUS ||
                  transaction.type === TransactionType.REFERRAL_PROFIT
                    ? "+"
                    : "-"}
                  {formatCurrency(transaction.amount, "BDT")}
                </div>
              </div>
            ))}

            {transactions.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/user/transactions")}
              >
                View All Transactions
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
