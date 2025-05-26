"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PaymentStatus, PaymentGateway, Currency } from "@/types/payment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentDetailsProps {
  paymentId: number;
  onBack: () => void;
  onAction?: () => void;
  isDialog?: boolean;
}

export function PaymentDetails({
  paymentId,
  onBack,
  onAction,
  isDialog = false,
}: PaymentDetailsProps) {
  const [payment, setPayment] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.payments.getById(paymentId);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setPayment(response.data.payment);
        if (response.data.transaction) {
          setTransaction(response.data.transaction);

          // If we have a transaction, try to get the user info
          if (response.data.transaction.user_id) {
            try {
              const userResponse = await api.users.getById(
                response.data.transaction.user_id
              );
              if (userResponse.data && userResponse.data.user) {
                setUser(userResponse.data.user);
              }
            } catch (err) {
              console.error("Error fetching user details:", err);
              // Non-blocking error, we can continue without user details
            }
          }
        }
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

  const handleApprove = async () => {
    if (!payment) return;

    setActionLoading(true);
    try {
      const response = await api.payments.approve(payment.id);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data or navigate back
      if (onAction) {
        onAction();
      } else {
        fetchPaymentDetails();
        setShowActionDialog(false);
      }
    } catch (err) {
      console.error("Error approving payment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve payment"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!payment || !rejectionReason) return;

    setActionLoading(true);
    try {
      const response = await api.payments.reject(payment.id, rejectionReason);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data or navigate back
      if (onAction) {
        onAction();
      } else {
        fetchPaymentDetails();
        setShowActionDialog(false);
      }
    } catch (err) {
      console.error("Error rejecting payment:", err);
      setError(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  };

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

  const formatGatewayName = (gateway: string) => {
    switch (gateway) {
      case PaymentGateway.COINGATE:
        return "CoinGate";
      case PaymentGateway.UDDOKTAPAY:
        return "UddoktaPay";
      case PaymentGateway.MANUAL:
        return "Manual Payment";
      default:
        return gateway;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <Card className={`${isDialog ? "" : "p-6"}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
          <p className="text-gray-500 mb-6">
            The payment with ID {paymentId} could not be found.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </Card>
    );
  }

  // The main content that will be rendered inside a Card or directly in a dialog
  const content = (
    <>
      {!isDialog && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Payment #{payment.id}</h2>
              <p className="text-gray-500 mt-1">
                {formatGatewayName(payment.gateway)} •{" "}
                {formatDate(payment.created_at)}
              </p>
            </div>
            <div>{getStatusBadge(payment.status)}</div>
          </div>
        </div>
      )}

      <div className={`${isDialog ? "" : "p-6"}`}>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Payment Details</TabsTrigger>
            <TabsTrigger value="transaction">Transaction Info</TabsTrigger>
            {user && <TabsTrigger value="user">User Information</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Payment Information
                </h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Amount
                    </dt>
                    <dd className="mt-1 text-lg font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Payment Gateway
                    </dt>
                    <dd className="mt-1">
                      {formatGatewayName(payment.gateway)}
                    </dd>
                  </div>
                  {payment.gateway_reference && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Gateway Reference
                      </dt>
                      <dd className="mt-1">{payment.gateway_reference}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="mt-1">{getStatusBadge(payment.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1">{formatDate(payment.created_at)}</dd>
                  </div>
                </dl>
              </div>

              {payment.metadata && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Payment Metadata</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-64 p-4 bg-gray-100 rounded-md">
                      {JSON.stringify(payment.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {payment.status === PaymentStatus.PENDING &&
              payment.gateway === PaymentGateway.MANUAL && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionType("reject");
                      setShowActionDialog(true);
                    }}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setActionType("approve");
                      setShowActionDialog(true);
                    }}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
          </TabsContent>

          <TabsContent value="transaction">
            {transaction ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-indigo-100 rounded-full">
                    <Receipt className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">
                      Transaction #{transaction.id}
                    </h3>
                    <p className="text-gray-500">
                      User ID: {transaction.user_id}
                    </p>
                  </div>
                </div>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Amount
                    </dt>
                    <dd className="mt-1 text-lg font-semibold">
                      {formatCurrency(transaction.amount, "BDT")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 capitalize">
                      {transaction.type.replace("_", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="mt-1 capitalize">{transaction.status}</dd>
                  </div>
                  {transaction.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Description
                      </dt>
                      <dd className="mt-1">{transaction.description}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1">
                      {formatDate(transaction.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  Transaction Details Not Available
                </h3>
                <p className="mt-1 text-gray-500">
                  No transaction information is associated with this payment.
                </p>
              </div>
            )}
          </TabsContent>

          {user && (
            <TabsContent value="user">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{user.name}</h3>
                    <p className="text-gray-500">User ID: {user.id}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Email
                      </dt>
                      <dd className="mt-1">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Phone
                      </dt>
                      <dd className="mt-1">{user.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Account Balance
                      </dt>
                      <dd className="mt-1 font-semibold">
                        {formatCurrency(user.balance, "BDT")}
                      </dd>
                    </div>
                  </dl>

                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Referral Code
                      </dt>
                      <dd className="mt-1">{user.referral_code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        KYC Verified
                      </dt>
                      <dd className="mt-1">
                        {user.is_kyc_verified ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Registration Date
                      </dt>
                      <dd className="mt-1">{formatDate(user.created_at)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/users/${user.id}`, "_blank")}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );

  return (
    <>
      {/* If not in a dialog, wrap with Card */}
      {!isDialog ? <Card className="overflow-hidden">{content}</Card> : content}

      {/* Action Dialog - Approve or Reject */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve the manual payment and add funds to the user's balance."
                : "This will reject the payment request and notify the user."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            {actionType === "reject" && (
              <div className="space-y-2">
                <Label
                  htmlFor="rejectionReason"
                  className="after:content-['*'] after:ml-0.5 after:text-red-500"
                >
                  Rejection Reason
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this payment is being rejected"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  This reason will be visible to the user.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={actionType === "approve" ? handleApprove : handleReject}
              disabled={
                actionLoading || (actionType === "reject" && !rejectionReason)
              }
              className="gap-2"
            >
              {actionLoading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {actionType === "approve" ? "Approve Payment" : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
