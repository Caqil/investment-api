// src/components/kyc/approve-kyc-dialog.tsx
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
import { KYCDocument } from "../../types/kyc";

interface ApproveKYCDialogProps {
  document: KYCDocument;
  onApprove: (id: number) => Promise<void>;
}

export function ApproveKYCDialog({
  document,
  onApprove,
}: ApproveKYCDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);

    try {
      await onApprove(document.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Error approving KYC:", error);
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
        <Button size="sm">Approve</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve KYC Verification</DialogTitle>
          <DialogDescription>
            You are about to approve a KYC verification for User #
            {document.user_id}. Document type:{" "}
            {formatDocumentType(document.document_type)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm">
            By approving this verification, the user will receive a blue
            verification badge on their profile, and they will have full access
            to all platform features.
          </p>
          <p className="text-sm font-medium">
            Make sure you have carefully reviewed all submitted documents before
            approval.
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
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading ? "Approving..." : "Approve Verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
