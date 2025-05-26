"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/types/transaction";
import {
  SearchIcon,
  FilterIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DownloadIcon,
} from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await userApi.transactions.getAll();

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setTransactions(response.data.transactions);
          setFilteredTransactions(response.data.transactions);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load transactions"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...transactions];

    // Apply type filter
    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(term) ||
          t.type.toLowerCase().includes(term) ||
          t.status.toLowerCase().includes(term) ||
          t.id.toString().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredTransactions(result);
  }, [transactions, typeFilter, statusFilter, searchTerm, sortDirection]);

  // Download transactions as CSV
  const downloadTransactions = () => {
    // Create CSV content
    const headers = ["ID", "Type", "Amount", "Status", "Description", "Date"];
    const csvRows = [headers];

    // Add transaction data
    filteredTransactions.forEach((t) => {
      csvRows.push([
        t.id.toString(),
        t.type,
        t.amount.toString(),
        t.status,
        t.description || "",
        new Date(t.created_at).toISOString(),
      ]);
    });

    // Create CSV content
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get transaction icon/color
  const getTransactionTypeDetails = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return { color: "text-green-600", sign: "+" };
      case TransactionType.WITHDRAWAL:
        return { color: "text-red-600", sign: "-" };
      case TransactionType.BONUS:
      case TransactionType.REFERRAL_BONUS:
      case TransactionType.REFERRAL_PROFIT:
        return { color: "text-blue-600", sign: "+" };
      case TransactionType.PLAN_PURCHASE:
        return { color: "text-purple-600", sign: "-" };
      default:
        return { color: "text-gray-600", sign: "" };
    }
  };

  // Get status badge
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
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">
          Transaction History
        </h2>
        <p className="text-muted-foreground">
          View and filter your complete transaction history
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                All deposits, withdrawals, and other transactions
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTransactions}
                disabled={isLoading || filteredTransactions.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                  setStatusFilter("");
                }}
                className="hidden sm:flex"
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value={TransactionType.DEPOSIT}>
                    Deposits
                  </SelectItem>
                  <SelectItem value={TransactionType.WITHDRAWAL}>
                    Withdrawals
                  </SelectItem>
                  <SelectItem value={TransactionType.BONUS}>Bonuses</SelectItem>
                  <SelectItem value={TransactionType.REFERRAL_BONUS}>
                    Referral Bonuses
                  </SelectItem>
                  <SelectItem value={TransactionType.PLAN_PURCHASE}>
                    Plan Purchases
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value={TransactionStatus.COMPLETED}>
                    Completed
                  </SelectItem>
                  <SelectItem value={TransactionStatus.PENDING}>
                    Pending
                  </SelectItem>
                  <SelectItem value={TransactionStatus.REJECTED}>
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSortDirection(sortDirection === "desc" ? "asc" : "desc")
                }
              >
                {sortDirection === "desc" ? (
                  <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <SearchIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                No transactions found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {transactions.length === 0
                  ? "You haven't made any transactions yet."
                  : "Try adjusting your search filters to find what you're looking for."}
              </p>
              {transactions.length > 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("");
                    setStatusFilter("");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const typeDetails = getTransactionTypeDetails(
                      transaction.type
                    );
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          #{transaction.id}
                        </TableCell>
                        <TableCell>
                          {transaction.type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description || "—"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${typeDetails.color}`}
                        >
                          {typeDetails.sign}
                          {formatCurrency(transaction.amount, "BDT")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
