"use client";

import { useState } from "react";
import { Withdrawal, WithdrawalStatus } from "@/types/withdrawal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface ApprovalActionsProps {
  withdrawal: Withdrawal;
  onActionComplete?: () => void;
  disabled?: boolean;
  variant?: "default" | "compact";
}

export function ApprovalActions({
  withdrawal,
  onActionComplete,
  disabled = false,
  variant = "default",
}: ApprovalActionsProps) {
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show actions for pending withdrawals
  if (withdrawal.status !== WithdrawalStatus.PENDING) {
    return null;
  }

  const handleApprove = async () => {
    if (!withdrawal) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await api.withdrawals.approve(withdrawal.id, adminNote);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowActionDialog(false);
      if (onActionComplete) {
        onActionComplete();
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
    setError(null);

    try {
      const response = await api.withdrawals.reject(
        withdrawal.id,
        rejectionReason
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setShowActionDialog(false);
      if (onActionComplete) {
        onActionComplete();
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

  // Compact variant for table rows
  if (variant === "compact") {
    return (
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActionType("approve");
            setShowActionDialog(true);
          }}
          disabled={disabled}
          className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActionType("reject");
            setShowActionDialog(true);
          }}
          disabled={disabled}
          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>

        {/* Action Dialog */}
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
              <Alert variant="destructive">
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
                onClick={
                  actionType === "approve" ? handleApprove : handleReject
                }
                disabled={
                  actionLoading || (actionType === "reject" && !rejectionReason)
                }
                className="gap-2"
              >
                {actionLoading && (
                  <svg
                    className="animate-spin h-4 w-4"
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
      </div>
    );
  }

  // Default variant with full buttons
  return (
    <div className="flex justify-end space-x-3">
      <Button
        variant="outline"
        onClick={() => {
          setActionType("reject");
          setShowActionDialog(true);
        }}
        disabled={disabled}
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
        disabled={disabled}
        className="gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        Approve
      </Button>

      {/* Action Dialog */}
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
            <Alert variant="destructive">
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
                  className="animate-spin h-4 w-4"
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
    </div>
  );
}
