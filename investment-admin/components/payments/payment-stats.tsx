// investment-admin/components/payments/payment-stats.tsx
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowUpRight,
  BanknoteIcon,
  Clock,
  CheckCircle,
  XCircle,
  ArrowDownRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentStatsProps {
  stats: {
    totalPayments: number;
    totalPending: number;
    totalCompleted: number;
    totalFailed: number;
    totalAmount: number;
    totalManualPayments: number;
  };
  loading: boolean;
}

export function PaymentStats({ stats, loading }: PaymentStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <BanknoteIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Manual: {stats.totalManualPayments}
          </p>
        </CardContent>
      </Card>

      {/* Total Amount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount, "USD")}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            From {stats.totalPayments} payments
          </p>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold">{stats.totalPending}</div>
          )}
          <p className="text-xs text-muted-foreground">Awaiting approval</p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold">
              {stats.totalPayments > 0
                ? `${Math.round(
                    (stats.totalCompleted / stats.totalPayments) * 100
                  )}%`
                : "0%"}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {stats.totalCompleted} successful / {stats.totalFailed} failed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
