// components/user/transaction-list.tsx
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  status: string;
  description?: string;
  created_at: string;
}

interface UserTransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function UserTransactionList({
  transactions,
  isLoading,
}: UserTransactionListProps) {
  // Get transaction type badge variant
  const getTypeVariant = (type: string) => {
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
  const getStatusVariant = (status: string) => {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between pb-4 border-b last:border-b-0 last:pb-0"
        >
          <div>
            <p className="text-sm font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
                signDisplay:
                  transaction.type === "withdrawal" ? "never" : "auto",
              }).format(transaction.amount)}
              {transaction.type === "withdrawal" && " (Debit)"}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.description || transaction.type.replace("_", " ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getTypeVariant(transaction.type)}>
              {transaction.type.replace("_", " ")}
            </Badge>
            <Badge variant={getStatusVariant(transaction.status)}>
              {transaction.status}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(transaction.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
