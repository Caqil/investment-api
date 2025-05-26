// investment-admin/components/payments/payment-details.tsx
import { useState, useEffect } from "react";
import { Payment, PaymentStatus, PaymentGateway } from "@/types/payment";
import { Transaction, TransactionType } from "@/types/transaction";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  CreditCard,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PaymentDetailsProps {
  paymentId: number;
  onBack?: () => void;
  onPaymentAction?: () => void;
}

export function PaymentDetails({
  paymentId,
  onBack,
  onPaymentAction,
}: PaymentDetailsProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the actual API endpoint to get payment details by ID
      const response = await api.payments.getById(paymentId);

      if (response.error) {
        throw new Error(response.error);
      }

      // Extract payment from the response data
      const responseData = response.data;
      if (!responseData || !responseData.payment) {
        throw new Error("Payment not found");
      }

      setPayment(responseData.payment);

      // Check if transaction exists in the response
      if (responseData.transaction) {
        setTransaction(responseData.transaction);
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load payment details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const handleApprove = async () => {
    if (!payment) return;

    setIsSubmitting(true);
    try {
      await api.payments.approve(payment.id);
      toast.success("Payment approved successfully");
      if (onPaymentAction) onPaymentAction();
    } catch (error) {
      toast.error("Failed to approve payment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!payment || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.payments.reject(payment.id, rejectionReason);
      toast.success("Payment rejected successfully");
      if (onPaymentAction) onPaymentAction();
    } catch (error) {
      toast.error("Failed to reject payment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case PaymentStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case PaymentStatus.FAILED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error || "Payment not found"}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onBack}>Back</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Details</h2>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Payments
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payment #{payment.id}</span>
              {getStatusBadge(payment.status)}
            </CardTitle>
            <CardDescription>
              {payment.gateway === PaymentGateway.MANUAL
                ? "Manual payment submission"
                : `Payment via ${payment.gateway}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Amount</TableCell>
                  <TableCell>
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Gateway</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.gateway}</Badge>
                  </TableCell>
                </TableRow>
                {payment.gateway_reference && (
                  <TableRow>
                    <TableCell className="font-semibold">Reference</TableCell>
                    <TableCell>{payment.gateway_reference}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-semibold">Date</TableCell>
                  <TableCell>{formatDate(payment.created_at)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">
                    Transaction ID
                  </TableCell>
                  <TableCell>{payment.transaction_id}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          {payment.status === PaymentStatus.PENDING && (
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full">
                <Button
                  onClick={handleApprove}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Approve Payment"}
                </Button>
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <div className="flex space-x-2">
                  <Input
                    id="rejection-reason"
                    placeholder="Enter reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isSubmitting || !rejectionReason.trim()}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Transaction Information */}
        {transaction && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Transaction Details
              </CardTitle>
              <CardDescription>
                Associated transaction information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">
                      Transaction ID
                    </TableCell>
                    <TableCell>{transaction.id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Type</TableCell>
                    <TableCell className="capitalize">
                      {transaction.type}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Status</TableCell>
                    <TableCell className="capitalize">
                      {transaction.status}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Amount</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Description</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Date</TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <a href={`/transactions?id=${transaction.id}`}>
                  View Full Transaction
                </a>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Additional payment metadata could be displayed here */}
      {payment.gateway === PaymentGateway.MANUAL && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Payment Details</CardTitle>
            <CardDescription>
              Information provided by the user for this manual payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The following information was provided by the user when submitting
              this manual payment.
            </p>

            {/* This would be populated with actual metadata from the payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Transaction ID</Label>
                <div className="text-sm border rounded-md p-2 bg-muted">
                  {payment.gateway_reference || "N/A"}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Payment Method</Label>
                <div className="text-sm border rounded-md p-2 bg-muted">
                  Mobile Banking
                </div>
              </div>
              <div className="space-y-1">
                <Label>Sender Information</Label>
                <div className="text-sm border rounded-md p-2 bg-muted">
                  Phone: +1234567890
                </div>
              </div>
              <div className="space-y-1">
                <Label>Date Submitted</Label>
                <div className="text-sm border rounded-md p-2 bg-muted">
                  {formatDate(payment.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
