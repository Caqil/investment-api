// src/components/dashboard/recent-withdrawals.tsx
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
import { Withdrawal, WithdrawalStatus } from "../../types/withdrawal";

interface RecentWithdrawalsProps {
  withdrawals: Withdrawal[];
}

export function RecentWithdrawals({ withdrawals }: RecentWithdrawalsProps) {
  // Get status badge variant
  const getStatusBadgeVariant = (status: WithdrawalStatus) => {
    switch (status) {
      case "pending":
        return "outline";
      case "approved":
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
        <CardTitle>Recent Withdrawals</CardTitle>
        <CardDescription>Latest withdrawal requests from users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent withdrawals found
            </p>
          ) : (
            withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between space-x-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    Amount:{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "BDT",
                    }).format(withdrawal.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Method: {withdrawal.payment_method}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(withdrawal.status)}>
                    {withdrawal.status.charAt(0).toUpperCase() +
                      withdrawal.status.slice(1)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(withdrawal.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  <Link
                    href={`/withdrawals/${withdrawal.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
