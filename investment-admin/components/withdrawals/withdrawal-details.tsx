"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { WithdrawalStatus } from "@/types/withdrawal";
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
  Clock,
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

interface WithdrawalDetailsProps {
  withdrawalId: number;
  onBack: () => void;
  onAction?: () => void;
  isDialog?: boolean; // Add this prop to determine if rendered in a dialog
}

export function WithdrawalDetails({
  withdrawalId,
  onBack,
  onAction,
  isDialog = false,
}: WithdrawalDetailsProps) {
  const [withdrawal, setWithdrawal] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);

  useEffect(() => {
    fetchWithdrawalDetails();
  }, [withdrawalId]);

  const fetchWithdrawalDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.withdrawals.getById(withdrawalId);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setWithdrawal(response.data.withdrawal);
        if (response.data.user) {
          setUser(response.data.user);
        }
      }
    } catch (err) {
      console.error("Error fetching withdrawal details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load withdrawal details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!withdrawal) return;

    setActionLoading(true);
    try {
      const response = await api.withdrawals.approve(withdrawal.id, adminNote);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data or navigate back
      if (onAction) {
        onAction();
      } else {
        fetchWithdrawalDetails();
        setShowActionDialog(false);
      }
    } catch (err) {
      console.error("Error approving withdrawal:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve withdrawal"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!withdrawal || !rejectionReason) return;

    setActionLoading(true);
    try {
      const response = await api.withdrawals.reject(
        withdrawal.id,
        rejectionReason
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data or navigate back
      if (onAction) {
        onAction();
      } else {
        fetchWithdrawalDetails();
        setShowActionDialog(false);
      }
    } catch (err) {
      console.error("Error rejecting withdrawal:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reject withdrawal"
      );
    } finally {
      setActionLoading(false);
    }
  };
  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case WithdrawalStatus.APPROVED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Approved
          </Badge>
        );
      case WithdrawalStatus.REJECTED:
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

  if (loading) {
    return (
      <Card className={`${isDialog ? "" : "p-6"}`}>
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
      </Card>
    );
  }

  if (!withdrawal) {
    return (
      <Card className={`${isDialog ? "" : "p-6"}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Withdrawal Not Found</h2>
          <p className="text-gray-500 mb-6">
            The withdrawal with ID {withdrawalId} could not be found.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </Card>
    );
  }

  // The main content that will be rendered inside a Card or directly in a dialog
  const content = (
    <>
      <div
        className={`${
          isDialog ? "" : "p-6"
        } bg-gradient-to-r from-blue-50 to-indigo-50 border-b`}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Withdrawal #{withdrawal.id}</h2>
            <p className="text-gray-500 mt-1">
              Requested on {formatDate(withdrawal.created_at)}
            </p>
          </div>
          <div>{getStatusBadge(withdrawal.status)}</div>
        </div>
      </div>

      <div className={`${isDialog ? "" : "p-6"}`}>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="user">User Information</TabsTrigger>
            <TabsTrigger value="payment">Payment Details</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Withdrawal Information
                </h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Amount
                    </dt>
                    <dd className="mt-1 text-lg font-semibold">
                      {formatCurrency(withdrawal.amount, "BDT")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Payment Method
                    </dt>
                    <dd className="mt-1">{withdrawal.payment_method}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="mt-1">
                      {getStatusBadge(withdrawal.status)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Tasks Completed
                    </dt>
                    <dd className="mt-1">
                      {withdrawal.tasks_completed ? "Yes" : "No"}
                    </dd>
                  </div>
                  {withdrawal.admin_note && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Admin Note
                      </dt>
                      <dd className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                        {withdrawal.admin_note}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Timeline</h3>
                <div className="relative border-l-2 border-gray-200 pl-6 pb-2">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300"></div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium">
                      Withdrawal Requested
                    </h4>
                    <time className="text-xs text-gray-500">
                      {formatDate(withdrawal.created_at)}
                    </time>
                    <p className="text-sm mt-1">
                      User requested a withdrawal of{" "}
                      {formatCurrency(withdrawal.amount, "BDT")} via{" "}
                      {withdrawal.payment_method}
                    </p>
                  </div>

                  {withdrawal.status !== WithdrawalStatus.PENDING && (
                    <div className="relative">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300"></div>
                      <div>
                        <h4 className="text-sm font-medium">
                          Withdrawal{" "}
                          {withdrawal.status === WithdrawalStatus.APPROVED
                            ? "Approved"
                            : "Rejected"}
                        </h4>
                        <time className="text-xs text-gray-500">
                          {formatDate(
                            withdrawal.updated_at || withdrawal.created_at
                          )}
                        </time>
                        <p className="text-sm mt-1">
                          {withdrawal.status === WithdrawalStatus.APPROVED
                            ? `Withdrawal was approved. ${
                                withdrawal.admin_note
                                  ? `Note: ${withdrawal.admin_note}`
                                  : ""
                              }`
                            : `Withdrawal was rejected. Reason: ${
                                withdrawal.admin_note || "No reason provided"
                              }`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {withdrawal.status === WithdrawalStatus.PENDING && (
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

          <TabsContent value="user">
            {user ? (
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
            ) : (
              <div className="py-12 text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  User Details Not Available
                </h3>
                <p className="mt-1 text-gray-500">
                  Detailed user information couldn't be loaded.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payment">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">Payment Details</h3>
                  <p className="text-gray-500">
                    Method: {withdrawal.payment_method}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Payment Information
                </h4>
                <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-64 p-4 bg-gray-100 rounded-md">
                  {JSON.stringify(withdrawal.payment_details, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
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
              {actionType === "approve"
                ? "Approve Withdrawal"
                : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve the withdrawal request and complete the transaction."
                : "This will reject the withdrawal request and return the funds to the user's balance."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            {actionType === "approve" ? (
              <div className="space-y-2">
                <Label htmlFor="adminNote">Admin Note (Optional)</Label>
                <Textarea
                  id="adminNote"
                  placeholder="Add a note for internal reference"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label
                  htmlFor="rejectionReason"
                  className="after:content-['*'] after:ml-0.5 after:text-red-500"
                >
                  Rejection Reason
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this withdrawal is being rejected"
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
              {actionType === "approve"
                ? "Approve Withdrawal"
                : "Reject Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
