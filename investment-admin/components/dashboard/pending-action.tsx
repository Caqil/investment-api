"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ShieldCheck, AlertTriangle } from "lucide-react";

interface PendingAction {
  id: string;
  type: "kyc" | "withdrawal" | "payment";
  count: number;
  description: string;
  route: string;
}

interface PendingActionsProps {
  pendingWithdrawals?: number;
  pendingKyc?: number;
  pendingPayments?: number;
  loading?: boolean;
}

export function PendingActions({
  pendingWithdrawals = 0,
  pendingKyc = 0,
  pendingPayments = 0,
  loading = false,
}: PendingActionsProps) {
  const router = useRouter();

  // Create array of pending actions
  const pendingActions: PendingAction[] = [
    {
      id: "kyc",
      type: "kyc" as const, // Using const assertion to ensure correct type
      count: pendingKyc,
      description: "KYC verifications awaiting approval",
      route: "/kyc",
    },
    {
      id: "withdrawals",
      type: "withdrawal" as const, // Using const assertion to ensure correct type
      count: pendingWithdrawals,
      description: "Withdrawal requests pending approval",
      route: "/withdrawals",
    },
    {
      id: "payments",
      type: "payment" as const, // Using const assertion to ensure correct type
      count: pendingPayments,
      description: "Manual payments awaiting confirmation",
      route: "/payments",
    },
  ].filter((action) => action.count > 0);

  const getActionIcon = (type: string) => {
    switch (type) {
      case "kyc":
        return <ShieldCheck className="h-5 w-5 text-purple-500" />;
      case "withdrawal":
        return <CreditCard className="h-5 w-5 text-yellow-500" />;
      case "payment":
        return <AlertTriangle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
        <CardDescription>Items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2"
              >
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : pendingActions.length > 0 ? (
          <div className="space-y-4">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                    {getActionIcon(action.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {action.type === "kyc"
                          ? "KYC Verifications"
                          : action.type === "withdrawal"
                          ? "Withdrawals"
                          : "Payments"}
                      </p>
                      <Badge>{action.count}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(action.route)}
                >
                  Review
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-3 dark:bg-green-900">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              There are no pending actions requiring your attention
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
