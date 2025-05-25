// components/kyc/kyc-table.tsx
import React, { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, FileText } from "lucide-react";
import { KYCDocument, DocumentType } from "@/types/kyc";
import { Textarea } from "@/components/ui/textarea";

interface KYCTableProps {
  documents: KYCDocument[];
  isLoading: boolean;
  error: string | null;
  showActions?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number, reason: string) => void;
}

export function KYCTable({
  documents,
  isLoading,
  error,
  showActions = true,
  onApprove,
  onReject,
}: KYCTableProps) {
  const [selectedKYC, setSelectedKYC] = useState<KYCDocument | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleApprove = () => {
    if (selectedKYC && onApprove) {
      onApprove(selectedKYC.id);
      setIsApproveDialogOpen(false);
    }
  };

  const handleReject = () => {
    if (selectedKYC && onReject && rejectReason.trim()) {
      onReject(selectedKYC.id, rejectReason);
      setIsRejectDialogOpen(false);
      setRejectReason("");
    }
  };

  const formatDocumentType = (type: DocumentType): string => {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-10 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="py-10 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No KYC documents found</p>
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
              <TableHead>User ID</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Note</TableHead>
              {showActions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.id}</TableCell>
                <TableCell>{doc.user_id}</TableCell>
                <TableCell>{formatDocumentType(doc.document_type)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      doc.status === "approved"
                        ? "default"
                        : doc.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(doc.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {doc.admin_note || "-"}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedKYC(doc);
                          setIsPreviewOpen(true);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedKYC(doc);
                          setIsApproveDialogOpen(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedKYC(doc);
                          setIsRejectDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve KYC Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this KYC document? This action
              will mark the user as verified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove}>Confirm Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC document. This
              message will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="The document provided is unclear or does not match the requirements..."
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>KYC Document Preview</DialogTitle>
            <DialogDescription>
              User ID: {selectedKYC?.user_id} - Document Type:{" "}
              {selectedKYC && formatDocumentType(selectedKYC.document_type)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label>Document Front</Label>
              <div className="mt-1 border rounded-md overflow-hidden">
                {selectedKYC?.document_front_url ? (
                  <img
                    src={selectedKYC.document_front_url}
                    alt="Document Front"
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Document Back</Label>
              <div className="mt-1 border rounded-md overflow-hidden">
                {selectedKYC?.document_back_url ? (
                  <img
                    src={selectedKYC.document_back_url}
                    alt="Document Back"
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Selfie</Label>
              <div className="mt-1 border rounded-md overflow-hidden">
                {selectedKYC?.selfie_url ? (
                  <img
                    src={selectedKYC.selfie_url}
                    alt="Selfie"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setIsApproveDialogOpen(true);
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setIsRejectDialogOpen(true);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
