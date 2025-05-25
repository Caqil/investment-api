// src/components/withdrawals/approve-withdrawal-dialog.tsx
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

interface ApproveWithdrawalDialogProps {
  withdrawal: Withdrawal;
  onApprove: (id: number, adminNote: string) => Promise<void>;
}

export function ApproveWithdrawalDialog({
  withdrawal,
  onApprove,
}: ApproveWithdrawalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);

    try {
      await onApprove(withdrawal.id, adminNote);
      setIsOpen(false);
      setAdminNote("");
    } catch (error) {
      console.error("Error approving withdrawal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Approve</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Withdrawal</DialogTitle>
          <DialogDescription>
            You are about to approve a withdrawal request of{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "BDT",
            }).format(withdrawal.amount)}{" "}
            via {withdrawal.payment_method}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-note">Admin Note (Optional)</Label>
            <Input
              id="admin-note"
              placeholder="Add a note for this approval"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
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
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
