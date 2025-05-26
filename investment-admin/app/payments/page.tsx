// investment-admin/app/payments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Payment, PaymentStatus, PaymentGateway } from "@/types/payment";
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
import { PaymentStats } from "@/components/payments/payment-stats";
import { PaymentsTable } from "@/components/payments/payments-table";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Payment statistics
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalPending: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalAmount: 0,
    totalManualPayments: 0,
  });

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      // For manual payments, we fetch pending payments
      const pendingResponse = await api.payments.getPending();

      if (pendingResponse.error) {
        throw new Error(pendingResponse.error);
      }

      // In a real app, we'd fetch all payments, but for now we'll focus on manual pending payments
      // as that's what the API provides
      const fetchedPayments = pendingResponse.data?.payments || [];

      setPayments(fetchedPayments);

      // Calculate stats
      const totalPayments = fetchedPayments.length;
      const pendingPayments = fetchedPayments.filter(
        (p) => p.status === PaymentStatus.PENDING
      );
      const completedPayments = fetchedPayments.filter(
        (p) => p.status === PaymentStatus.COMPLETED
      );
      const failedPayments = fetchedPayments.filter(
        (p) => p.status === PaymentStatus.FAILED
      );
      const manualPayments = fetchedPayments.filter(
        (p) => p.gateway === PaymentGateway.MANUAL
      );

      const totalAmount = fetchedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      setStats({
        totalPayments,
        totalPending: pendingPayments.length,
        totalCompleted: completedPayments.length,
        totalFailed: failedPayments.length,
        totalAmount,
        totalManualPayments: manualPayments.length,
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err instanceof Error ? err.message : "Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refreshTrigger]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...payments];

    // Apply status filter based on active tab
    if (activeTab !== "all") {
      result = result.filter((payment) => payment.status === activeTab);
    }

    // Apply gateway filter
    if (gatewayFilter !== "all") {
      result = result.filter((payment) => payment.gateway === gatewayFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (payment) =>
          payment.gateway_reference?.toLowerCase().includes(query) ||
          payment.id.toString().includes(query) ||
          payment.amount.toString().includes(query)
      );
    }

    setFilteredPayments(result);
  }, [payments, activeTab, gatewayFilter, searchQuery]);

  const handleApprovePayment = async (paymentId: number) => {
    try {
      const response = await api.payments.approve(paymentId);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh the payments list
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error approving payment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve payment"
      );
    }
  };

  const handleRejectPayment = async (paymentId: number, reason: string) => {
    try {
      const response = await api.payments.reject(paymentId, reason);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh the payments list
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error rejecting payment:", err);
      setError(err instanceof Error ? err.message : "Failed to reject payment");
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Management
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

      {/* Payment Statistics */}
      <PaymentStats stats={stats} loading={loading} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by ID, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>
        <Select
          value={gatewayFilter}
          onValueChange={setGatewayFilter}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gateways</SelectItem>
            <SelectItem value={PaymentGateway.COINGATE}>Coingate</SelectItem>
            <SelectItem value={PaymentGateway.UDDOKTAPAY}>
              UddoktaPay
            </SelectItem>
            <SelectItem value={PaymentGateway.MANUAL}>Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for filtering by status */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value={PaymentStatus.PENDING}>Pending</TabsTrigger>
          <TabsTrigger value={PaymentStatus.COMPLETED}>Completed</TabsTrigger>
          <TabsTrigger value={PaymentStatus.FAILED}>Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onApprove={handleApprovePayment}
            onReject={handleRejectPayment}
          />
        </TabsContent>

        <TabsContent value={PaymentStatus.PENDING} className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onApprove={handleApprovePayment}
            onReject={handleRejectPayment}
          />
        </TabsContent>

        <TabsContent value={PaymentStatus.COMPLETED} className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onApprove={handleApprovePayment}
            onReject={handleRejectPayment}
          />
        </TabsContent>

        <TabsContent value={PaymentStatus.FAILED} className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onApprove={handleApprovePayment}
            onReject={handleRejectPayment}
          />
        </TabsContent>
      </Tabs>

      {payments.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No payments found</CardTitle>
            <CardDescription>
              {searchQuery || gatewayFilter !== "all"
                ? "Try adjusting your filters"
                : "There are no payments to display"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </DashboardShell>
  );
}
