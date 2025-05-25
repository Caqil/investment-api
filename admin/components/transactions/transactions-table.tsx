import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Transaction, TransactionStatus, TransactionType } from "../../types/transaction";
import { formatDistanceToNow, format } from "date-fns";

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export function TransactionsTable({
  transactions,
  isLoading,
  error,
}: TransactionsTableProps) {
  // Format transaction type for display
  const formatTransactionType = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "withdrawal":
        return "Withdrawal";
      case "bonus":
        return "Daily Bonus";
      case "referral_bonus":
        return "Referral Bonus";
      case "plan_purchase":
        return "Plan Purchase";
      case "referral_profit":
        return "Referral Profit";
      default:
        return type;
    }
  };

  // Get transaction type badge variant
  const getTypeBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return "default";
      case "withdrawal":
        return "destructive";
      case "bonus":
      case "referral_bonus":
      case "referral_profit":
        return "secondary";
      case "plan_purchase":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: TransactionStatus) => {
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-6"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-6"
              >
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">#{transaction.id}</TableCell>
                <TableCell>
                  <Link
                    href={`/users/${transaction.user_id}`}
                    className="text-blue-500 hover:underline"
                  >
                    User #{transaction.user_id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getTypeBadgeVariant(transaction.type)}>
                    {formatTransactionType(transaction.type)}
                  </Badge>
                </TableCell>
                <TableCell
                  className={
                    transaction.type === "withdrawal" ||
                    transaction.type === "plan_purchase"
                      ? "text-destructive"
                      : "text-green-600 dark:text-green-500"
                  }
                >
                  {transaction.type === "withdrawal" ||
                  transaction.type === "plan_purchase"
                    ? "-"
                    : "+"}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(transaction.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(transaction.created_at), "PP")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/transactions/${transaction.id}`} passHref>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
