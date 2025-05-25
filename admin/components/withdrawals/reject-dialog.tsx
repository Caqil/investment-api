// src/components/withdrawals/reject-withdrawal-dialog.tsx
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Withdrawal } from "../../types/withdrawal";

interface RejectWithdrawalDialogProps {
  withdrawal: Withdrawal;
  onReject: (id: number, reason: string) => Promise<void>;
}

export function RejectWithdrawalDialog({
  withdrawal,
  onReject,
}: RejectWithdrawalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    if (!reason) {
      setError("Please provide a reason for rejection");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onReject(withdrawal.id, reason);
      setIsOpen(false);
      setReason("");
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Withdrawal</DialogTitle>
          <DialogDescription>
            You are about to reject a withdrawal request of{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "BDT",
            }).format(withdrawal.amount)}{" "}
            via {withdrawal.payment_method}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Rejection <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              placeholder="Enter reason for rejection"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
          >
            {isLoading ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
