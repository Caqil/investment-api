import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Payment, PaymentStatus, PaymentGateway } from "@/types/payment";
import { Eye, CheckCircle, XCircle } from "lucide-react";

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
}

export function PaymentsTable({
  payments,
  loading,
  onApprove,
  onReject,
}: PaymentsTableProps) {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Function to determine badge color based on status
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

  // Function to determine gateway label
  const getGatewayLabel = (gateway: PaymentGateway) => {
    switch (gateway) {
      case PaymentGateway.COINGATE:
        return "Coingate";
      case PaymentGateway.UDDOKTAPAY:
        return "UddoktaPay";
      case PaymentGateway.MANUAL:
        return "Manual";
      default:
        return "Unknown";
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/payments/${id}`);
  };

  const handleApproveClick = (payment: Payment) => {
    onApprove(payment.id);
  };

  const handleRejectClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleConfirmReject = () => {
    if (selectedPayment && rejectionReason.trim()) {
      onReject(selectedPayment.id, rejectionReason);
      setShowRejectDialog(false);
      setSelectedPayment(null);
      setRejectionReason("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
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
                  className="text-center py-6 text-muted-foreground"
                >
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id}</TableCell>
                  <TableCell>{getGatewayLabel(payment.gateway)}</TableCell>
                  <TableCell>
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>{payment.gateway_reference || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{formatDate(payment.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(payment.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>

                      {payment.status === PaymentStatus.PENDING &&
                        payment.gateway === PaymentGateway.MANUAL && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              onClick={() => handleApproveClick(payment)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleRejectClick(payment)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. This will be
              visible to the user.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
