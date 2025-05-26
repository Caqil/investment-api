"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { KYCDocument, KYCStatus, DocumentType } from "@/types/kyc";
import { User } from "@/types/auth";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  UserCircle,
  Calendar,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface KYCDetailDialogProps {
  kycId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKYCUpdated: () => void;
}

export function KYCDetailDialog({
  kycId,
  open,
  onOpenChange,
  onKYCUpdated,
}: KYCDetailDialogProps) {
  const [kycDocument, setKYCDocument] = useState<KYCDocument | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For approve/reject actions
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    // Reset state when dialog opens/closes
    if (!open) {
      setKYCDocument(null);
      setUser(null);
      setError(null);
      setRejectionReason("");
      return;
    }

    // Skip fetching if no kycId is provided
    if (kycId === null) {
      return;
    }

    const fetchKYCDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.kyc.getById(kycId);

        if (response.error) {
          throw new Error(response.error);
        }

        setKYCDocument(response.data?.kyc_document || null);
        setUser(response.data?.user || null);
      } catch (err) {
        console.error("Error fetching KYC document:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load KYC document"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchKYCDocument();
  }, [kycId, open]);

  const handleApprove = async () => {
    if (!kycId) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await api.kyc.approve(kycId);

      if (response.error) {
        throw new Error(response.error);
      }

      // Close dialog and notify parent component
      onOpenChange(false);
      onKYCUpdated();
    } catch (err) {
      console.error("Error approving KYC:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve KYC document"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!kycId) return;

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await api.kyc.reject(kycId, rejectionReason.trim());

      if (response.error) {
        throw new Error(response.error);
      }

      // Close dialog and notify parent component
      onOpenChange(false);
      onKYCUpdated();
    } catch (err) {
      console.error("Error rejecting KYC:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reject KYC document"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case DocumentType.ID_CARD:
        return "ID Card";
      case DocumentType.PASSPORT:
        return "Passport";
      case DocumentType.DRIVING_LICENSE:
        return "Driving License";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case KYCStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case KYCStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case KYCStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const dialogTitle = loading
    ? "Loading KYC Document..."
    : kycDocument
    ? `KYC Document #${kycDocument.id}`
    : "KYC Document Not Found";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogTitle}
            {kycDocument && getStatusBadge(kycDocument.status)}
          </DialogTitle>
          <DialogDescription>
            Review KYC document and take action
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {kycDocument && !loading && (
          <div className="space-y-6">
            <Tabs defaultValue="document" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="document">Document Details</TabsTrigger>
                <TabsTrigger value="user">User Information</TabsTrigger>
              </TabsList>

              <TabsContent value="document" className="space-y-4 pt-4">
                {/* Document Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Document Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Document Type
                        </Label>
                        <p className="font-medium">
                          {getDocumentTypeName(kycDocument.document_type)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Submission Date
                        </Label>
                        <p className="font-medium">
                          {formatDate(kycDocument.created_at)}
                        </p>
                      </div>
                    </div>

                    {kycDocument.admin_note && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Admin Note
                        </Label>
                        <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                          {kycDocument.admin_note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Document Images */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Document Images</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Document Front
                      </Label>
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={kycDocument.document_front_url}
                          alt="Document Front"
                          className="w-full object-contain max-h-[300px]"
                        />
                      </div>
                    </div>

                    {kycDocument.document_back_url && (
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Document Back
                        </Label>
                        <div className="border rounded-md overflow-hidden">
                          <img
                            src={kycDocument.document_back_url}
                            alt="Document Back"
                            className="w-full object-contain max-h-[300px]"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Selfie with Document
                      </Label>
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={kycDocument.selfie_url}
                          alt="Selfie with Document"
                          className="w-full object-contain max-h-[300px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="user" className="space-y-4 pt-4">
                {user ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">User Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Name
                          </Label>
                          <p className="font-medium">{user.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Email
                          </Label>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Phone
                          </Label>
                          <p className="font-medium">{user.phone}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            User ID
                          </Label>
                          <p className="font-medium">{user.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Registered On
                          </Label>
                          <p className="font-medium">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Status
                          </Label>
                          <p className="font-medium">
                            {user.is_blocked ? (
                              <span className="text-red-500">Blocked</span>
                            ) : (
                              <span className="text-green-500">Active</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>User Information</CardTitle>
                      <CardDescription>
                        User details not available
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Action Section (only for pending documents) */}
            {kycDocument.status === KYCStatus.PENDING && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Take Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kycDocument.status === KYCStatus.PENDING && (
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="rejection-reason">
                          Rejection Reason (required for rejection)
                        </Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Enter reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                          onClick={handleReject}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>

                        <Button
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!loading && !kycDocument && !error && kycId !== null && (
          <Alert>
            <AlertDescription>KYC document not found</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || actionLoading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
