"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Withdrawal, WithdrawalStatus } from "@/types/withdrawal";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { WithdrawalsTable } from "@/components/withdrawals/withdrawals-table";
import { WithdrawalStats } from "@/components/withdrawals/withdrawals-stats";
interface WithdrawalStats {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  recent_withdrawals: Withdrawal[];
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<WithdrawalStats>({
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    recent_withdrawals: [],
  });

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (activeTab === "pending") {
        response = await api.withdrawals.getPending();
      } else if (activeTab === "approved") {
        response = await api.withdrawals.getAll(); // In a real app, you'd have a specific endpoint for this
      } else if (activeTab === "rejected") {
        response = await api.withdrawals.getAll(); // In a real app, you'd have a specific endpoint for this
      } else {
        response = await api.withdrawals.getAll();
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Filter withdrawals by status if needed
      let fetchedWithdrawals = response.data?.withdrawals || [];
      if (activeTab === "approved") {
        fetchedWithdrawals = fetchedWithdrawals.filter(
          (w) => w.status === WithdrawalStatus.APPROVED
        );
      } else if (activeTab === "rejected") {
        fetchedWithdrawals = fetchedWithdrawals.filter(
          (w) => w.status === WithdrawalStatus.REJECTED
        );
      }

      setWithdrawals(fetchedWithdrawals);

      // Fetch withdrawal stats
      const statsResponse = await api.withdrawals.getStats();
      if (!statsResponse.error && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load withdrawals"
      );
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [activeTab, refreshTrigger]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...withdrawals];

    // Apply payment method filter
    if (paymentMethodFilter !== "all") {
      result = result.filter(
        (withdrawal) => withdrawal.payment_method === paymentMethodFilter
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (withdrawal) =>
          withdrawal.id.toString().includes(query) ||
          withdrawal.amount.toString().includes(query) ||
          withdrawal.payment_method.toLowerCase().includes(query) ||
          withdrawal.user_id.toString().includes(query)
      );
    }

    setFilteredWithdrawals(result);
  }, [withdrawals, paymentMethodFilter, searchQuery]);

  const handleViewWithdrawal = (id: number) => {
    router.push(`/withdrawals/${id}`);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Get unique payment methods for filter
  const paymentMethods = Array.from(
    new Set(withdrawals.map((w) => w.payment_method))
  );

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Withdrawal Management
        </h1>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Withdrawal Statistics */}
      <WithdrawalStats stats={stats} loading={loading} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by ID, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>
        <Select
          value={paymentMethodFilter}
          onValueChange={setPaymentMethodFilter}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for filtering by status */}
      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <WithdrawalsTable
            withdrawals={filteredWithdrawals}
            loading={loading}
            onViewDetails={handleViewWithdrawal}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <WithdrawalsTable
            withdrawals={filteredWithdrawals}
            loading={loading}
            onViewDetails={handleViewWithdrawal}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <WithdrawalsTable
            withdrawals={filteredWithdrawals}
            loading={loading}
            onViewDetails={handleViewWithdrawal}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <WithdrawalsTable
            withdrawals={filteredWithdrawals}
            loading={loading}
            onViewDetails={handleViewWithdrawal}
          />
        </TabsContent>
      </Tabs>

      {filteredWithdrawals.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No withdrawals found</CardTitle>
            <CardDescription>
              {searchQuery || paymentMethodFilter !== "all"
                ? "Try adjusting your filters"
                : `There are no ${activeTab} withdrawals to display`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </DashboardShell>
  );
}
