// investment-admin/components/payments/payments-table.tsx
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Payment,
  PaymentStatus,
  PaymentGateway,
  Currency,
} from "@/types/payment";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  onApprove: (paymentId: number) => Promise<void>;
  onReject: (paymentId: number, reason: string) => Promise<void>;
}

export function PaymentsTable({
  payments,
  loading,
  onApprove,
  onReject,
}: PaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const handleApprove = async () => {
    if (!selectedPayment) return;

    setIsSubmitting(true);
    try {
      await onApprove(selectedPayment.id);
      toast.success("Payment approved successfully");
      setShowApproveDialog(false);
    } catch (error) {
      toast.error("Failed to approve payment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onReject(selectedPayment.id, rejectionReason);
      toast.success("Payment rejected successfully");
      setShowRejectDialog(false);
      setRejectionReason("");
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

  const getGatewayBadge = (gateway: PaymentGateway) => {
    switch (gateway) {
      case PaymentGateway.COINGATE:
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Coingate
          </Badge>
        );
      case PaymentGateway.UDDOKTAPAY:
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            UddoktaPay
          </Badge>
        );
      case PaymentGateway.MANUAL:
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Manual
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Unknown
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center h-24 text-muted-foreground"
              >
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.id}</TableCell>
                <TableCell>{getGatewayBadge(payment.gateway)}</TableCell>
                <TableCell>
                  {payment.gateway_reference ? (
                    <span className="flex items-center">
                      {payment.gateway_reference.substring(0, 10)}
                      {payment.gateway_reference.length > 10 ? "..." : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>{formatDate(payment.created_at)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {payment.status === PaymentStatus.PENDING && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowApproveDialog(true);
                          }}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowRejectDialog(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Reject</span>
                        </Button>
                      </>
                    )}
                    {/* View transaction details button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <a
                        href={`/transactions?payment=${payment.id}`}
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Approve Payment Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payment? This will add funds
              to the user's account.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="font-semibold">Payment ID:</div>
                <div>{selectedPayment.id}</div>

                <div className="font-semibold">Gateway:</div>
                <div>{selectedPayment.gateway}</div>

                <div className="font-semibold">Amount:</div>
                <div>
                  {formatCurrency(
                    selectedPayment.amount,
                    selectedPayment.currency
                  )}
                </div>

                <div className="font-semibold">Date:</div>
                <div>{formatDate(selectedPayment.created_at)}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Approve Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="font-semibold">Payment ID:</div>
                <div>{selectedPayment.id}</div>

                <div className="font-semibold">Gateway:</div>
                <div>{selectedPayment.gateway}</div>

                <div className="font-semibold">Amount:</div>
                <div>
                  {formatCurrency(
                    selectedPayment.amount,
                    selectedPayment.currency
                  )}
                </div>

                <div className="font-semibold">Date:</div>
                <div>{formatDate(selectedPayment.created_at)}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Input
                  id="rejection-reason"
                  placeholder="Enter reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? "Processing..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
