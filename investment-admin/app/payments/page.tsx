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
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentsTable } from "@/components/payments/payments-table";
import { PaymentStats } from "@/components/payments/payment-stats";
import { PaymentDetails } from "@/components/payments/payment-details";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PaymentStatsData {
  total_payments: number;
  total_amount: number;
  pending_count: number;
  completed_count: number;
  failed_count: number;
  manual_count?: number; // Make optional
  coingate_count?: number; // Make optional
  uddoktapay_count?: number; // Make optional
  recent_payments: Payment[];
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null
  );
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [stats, setStats] = useState<PaymentStatsData>({
    total_payments: 0,
    total_amount: 0,
    pending_count: 0,
    completed_count: 0,
    failed_count: 0,
    manual_count: 0,
    coingate_count: 0,
    uddoktapay_count: 0,
    recent_payments: [],
  });
  
  const fetchPaymentStats = async () => {
    try {
      const response = await api.payments.getStats();
      if (!response.error && response.data) {
        setStats({
          ...stats,
          ...response.data,
          recent_payments: response.data.recent_payments || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch payment stats:", error);
    }
  };
  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (activeTab === "pending") {
        response = await api.payments.getPending();
      } else {
        response = await api.payments.getAll();
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Filter payments by status if needed
      let fetchedPayments = response.data?.payments || [];
      if (activeTab === "completed") {
        fetchedPayments = fetchedPayments.filter(
          (p) => p.status === PaymentStatus.COMPLETED
        );
      } else if (activeTab === "failed") {
        fetchedPayments = fetchedPayments.filter(
          (p) => p.status === PaymentStatus.FAILED
        );
      }

      setPayments(fetchedPayments);

      // Fetch stats separately
      fetchPaymentStats();
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

    // Initial stats load
    fetchPaymentStats();
  }, [activeTab, refreshTrigger]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...payments];

    // Apply gateway filter
    if (gatewayFilter !== "all") {
      result = result.filter((payment) => payment.gateway === gatewayFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (payment) =>
          payment.id.toString().includes(query) ||
          payment.amount.toString().includes(query) ||
          payment.gateway.toLowerCase().includes(query) ||
          (payment.gateway_reference &&
            payment.gateway_reference.toLowerCase().includes(query))
      );
    }

    setFilteredPayments(result);
  }, [payments, gatewayFilter, searchQuery]);

  const handleViewPayment = (id: number) => {
    setSelectedPaymentId(id);
    // Find the payment in the current list
    const payment = payments.find((p) => p.id === id) || null;
    setSelectedPayment(payment);
    setIsDetailsDialogOpen(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePaymentAction = () => {
    // After a successful payment action, refresh the list and close the dialog
    setRefreshTrigger((prev) => prev + 1);
    setIsDetailsDialogOpen(false);
  };

  // Function to render status badges
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case PaymentStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Completed
          </Badge>
        );
      case PaymentStatus.FAILED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get unique gateways for filter
  const gateways = Array.from(new Set(payments.map((p) => p.gateway)));

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
            placeholder="Search by ID, amount, reference..."
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
            <SelectValue placeholder="Payment Gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gateways</SelectItem>
            {gateways.map((gateway) => (
              <SelectItem key={gateway} value={gateway}>
                {gateway === PaymentGateway.COINGATE
                  ? "CoinGate"
                  : gateway === PaymentGateway.UDDOKTAPAY
                  ? "UddoktaPay"
                  : "Manual"}
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
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="all">All Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onViewDetails={handleViewPayment}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onViewDetails={handleViewPayment}
          />
        </TabsContent>

        <TabsContent value="failed" className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onViewDetails={handleViewPayment}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onViewDetails={handleViewPayment}
          />
        </TabsContent>
      </Tabs>

      {filteredPayments.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No payments found</CardTitle>
            <CardDescription>
              {searchQuery || gatewayFilter !== "all"
                ? "Try adjusting your filters"
                : `There are no ${activeTab} payments to display`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>
                {selectedPaymentId
                  ? `Payment #${selectedPaymentId}`
                  : "Payment Details"}
              </DialogTitle>
              <div className="ml-4">
                {selectedPayment && getStatusBadge(selectedPayment.status)}
              </div>
            </div>
          </DialogHeader>
          {selectedPaymentId && (
            <PaymentDetails
              paymentId={selectedPaymentId}
              onBack={() => setIsDetailsDialogOpen(false)}
              onAction={handlePaymentAction}
              isDialog={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
