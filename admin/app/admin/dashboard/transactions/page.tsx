"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { TransactionsTable } from "../../../components/transactions/transactions-table";
import { TransactionTypeFilter } from "../../../components/transactions/transaction-type-filter";
import { Transaction, TransactionType } from "../../../types/transaction";
import { transactionsApi } from "../../../lib/api";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionType | "all">("all");

  // Fetch transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        // Type assertion using your existing Transaction[] type
        const data = (await transactionsApi.getAll()) as Transaction[];
        setTransactions(data);
        setFilteredTransactions(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transactions data");
        toast.error("Failed to load transactions data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []); // Removed toast dependency

  // Handle filter change
  const handleFilterChange = (type: TransactionType | "all") => {
    setFilter(type);

    if (type === "all") {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(
        transactions.filter((transaction) => transaction.type === type)
      );
    }
  };

  // Calculate transaction stats
  const totalDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProfits = transactions
    .filter(
      (t) =>
        (t.type === "bonus" ||
          t.type === "referral_bonus" ||
          t.type === "referral_profit") &&
        t.status === "completed"
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground">
          View and manage all platform transactions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Deposits
            </CardTitle>
            <CardDescription>Completed deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(totalDeposits)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawals
            </CardTitle>
            <CardDescription>Completed withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(totalWithdrawals)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Profits</CardTitle>
            <CardDescription>All bonuses & profits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "BDT",
              }).format(totalProfits)}
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionTypeFilter
        selectedType={filter}
        onTypeChange={handleFilterChange}
      />

      <TransactionsTable
        transactions={filteredTransactions}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
