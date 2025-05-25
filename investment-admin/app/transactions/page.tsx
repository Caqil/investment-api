// src/app/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/types/transaction";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we would include pagination, filters, etc.
      const response = await api.transactions.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      // Ensure we're properly typing our data
      // Using a type guard to ensure we have the correct data structure
      if (
        response.data &&
        "transactions" in response.data &&
        Array.isArray(response.data.transactions)
      ) {
        setTransactions(response.data.transactions as Transaction[]);
        setTotalPages(
          Math.ceil(response.data.transactions.length / itemsPerPage)
        );
      } else {
        // If API doesn't return expected data, set empty array
        setTransactions([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load transactions"
      );
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter and paginate transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesSearch =
      searchQuery === "" ||
      transaction.id.toString().includes(searchQuery) ||
      transaction.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFilteredPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage)
  );

  // Helper function to get badge color based on status
  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "secondary";
      case TransactionStatus.PENDING:
        return "default";
      case TransactionStatus.REJECTED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Helper function to get badge color based on transaction type
  const getTypeBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "secondary";
      case TransactionType.WITHDRAWAL:
        return "destructive";
      case TransactionType.BONUS:
        return "secondary";
      case TransactionType.REFERRAL_BONUS:
        return "default";
      case TransactionType.PLAN_PURCHASE:
        return "destructive";
      case TransactionType.REFERRAL_PROFIT:
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <Button onClick={fetchTransactions} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or description"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={TransactionType.DEPOSIT}>
                    Deposit
                  </SelectItem>
                  <SelectItem value={TransactionType.WITHDRAWAL}>
                    Withdrawal
                  </SelectItem>
                  <SelectItem value={TransactionType.BONUS}>Bonus</SelectItem>
                  <SelectItem value={TransactionType.REFERRAL_BONUS}>
                    Referral Bonus
                  </SelectItem>
                  <SelectItem value={TransactionType.PLAN_PURCHASE}>
                    Plan Purchase
                  </SelectItem>
                  <SelectItem value={TransactionType.REFERRAL_PROFIT}>
                    Referral Profit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.length > 0 ? (
                      paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            #{transaction.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getTypeBadgeVariant(transaction.type)}
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={
                              transaction.type === TransactionType.WITHDRAWAL
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {formatCurrency(transaction.amount, "BDT")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(
                                transaction.status
                              )}
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.description || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDate(transaction.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredTransactions.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {Math.min(
                      filteredTransactions.length,
                      (currentPage - 1) * itemsPerPage + 1
                    )}{" "}
                    to{" "}
                    {Math.min(
                      filteredTransactions.length,
                      currentPage * itemsPerPage
                    )}{" "}
                    of {filteredTransactions.length} transactions
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalFilteredPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
