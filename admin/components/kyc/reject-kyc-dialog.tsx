// src/components/kyc/reject-kyc-dialog.tsx
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
import { KYCDocument } from "../../types/kyc";

interface RejectKYCDialogProps {
  document: KYCDocument;
  onReject: (id: number, reason: string) => Promise<void>;
}

export function RejectKYCDialog({ document, onReject }: RejectKYCDialogProps) {
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
      await onReject(document.id, reason);
      setIsOpen(false);
      setReason("");
    } catch (error) {
      console.error("Error rejecting KYC:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format document type for display
  const formatDocumentType = (type: string) => {
    switch (type) {
      case "id_card":
        return "ID Card";
      case "passport":
        return "Passport";
      case "driving_license":
        return "Driving License";
      default:
        return type;
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
          <DialogTitle>Reject KYC Verification</DialogTitle>
          <DialogDescription>
            You are about to reject a KYC verification for User #
            {document.user_id}. Document type:{" "}
            {formatDocumentType(document.document_type)}.
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
          <p className="text-sm">
            The user will be notified with this reason and will be able to
            submit new documents.
          </p>
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
            {isLoading ? "Rejecting..." : "Reject Verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
