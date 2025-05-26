"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { KYCStatus, DocumentType } from "@/types/kyc";
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
  AlertCircle,
  FileText,
  Image,
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

interface KYCDetailsProps {
  kycId: number;
  onBack: () => void;
  onAction?: () => void;
}

export function KYCDetails({ kycId, onBack, onAction }: KYCDetailsProps) {
  const [kycDocument, setKycDocument] = useState<any>(null);
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
    fetchKYCDetails();
  }, [kycId]);

  const fetchKYCDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.kyc.getById(kycId);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        if (response.data.kyc_document) {
          setKycDocument(response.data.kyc_document);
        } else {
          setError("KYC document not found");
        }

        if (response.data.user) {
          setUser(response.data.user);
        }
      }
    } catch (err) {
      console.error("Error fetching KYC details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load KYC details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!kycDocument) return;

    setActionLoading(true);
    try {
      const response = await api.kyc.approve(kycDocument.id);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data or navigate back
      if (onAction) {
        onAction();
      } else {
        fetchKYCDetails();
        setShowActionDialog(false);
      }
    } catch (err) {
      console.error("Error approving KYC:", err);
      setError(err instanceof Error ? err.message : "Failed to approve KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!kycDocument || !rejectionReason) return;

    setActionLoading(true);
    try {
      const response = await api.kyc.reject(kycDocument.id, rejectionReason);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data or navigate back
      if (onAction) {
        onAction();
      } else {
        fetchKYCDetails();
        setShowActionDialog(false);
      }
    } catch (err) {
      console.error("Error rejecting KYC:", err);
      setError(err instanceof Error ? err.message : "Failed to reject KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case KYCStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case KYCStatus.APPROVED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Approved
          </Badge>
        );
      case KYCStatus.REJECTED:
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

  if (loading) {
    return (
      <Card className="p-6">
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

  if (!kycDocument) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">KYC Document Not Found</h2>
          <p className="text-gray-500 mb-6">
            The KYC document with ID {kycId} could not be found.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                KYC Document #{kycDocument.id}
              </h2>
              <p className="text-gray-500 mt-1">
                Submitted on {formatDate(kycDocument.created_at)}
              </p>
            </div>
            <div>{getStatusBadge(kycDocument.status)}</div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Document Details</TabsTrigger>
              <TabsTrigger value="user">User Information</TabsTrigger>
              <TabsTrigger value="images">Document Images</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">KYC Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Document Type
                      </dt>
                      <dd className="mt-1 text-lg">
                        {getDocumentTypeName(kycDocument.document_type)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Status
                      </dt>
                      <dd className="mt-1">
                        {getStatusBadge(kycDocument.status)}
                      </dd>
                    </div>
                    {kycDocument.admin_note && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Admin Note
                        </dt>
                        <dd className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                          {kycDocument.admin_note}
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
                        Document Submitted
                      </h4>
                      <time className="text-xs text-gray-500">
                        {formatDate(kycDocument.created_at)}
                      </time>
                      <p className="text-sm mt-1">
                        User submitted a{" "}
                        {getDocumentTypeName(kycDocument.document_type)} for
                        verification
                      </p>
                    </div>

                    {kycDocument.status !== KYCStatus.PENDING && (
                      <div className="relative">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300"></div>
                        <div>
                          <h4 className="text-sm font-medium">
                            Verification{" "}
                            {kycDocument.status === KYCStatus.APPROVED
                              ? "Approved"
                              : "Rejected"}
                          </h4>
                          <time className="text-xs text-gray-500">
                            {/* Assuming updated_at exists or fallback to created_at */}
                            {formatDate(
                              kycDocument.updated_at || kycDocument.created_at
                            )}
                          </time>
                          <p className="text-sm mt-1">
                            {kycDocument.status === KYCStatus.APPROVED
                              ? `Document was approved. User is now verified.`
                              : `Document was rejected. Reason: ${
                                  kycDocument.admin_note || "No reason provided"
                                }`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {kycDocument.status === KYCStatus.PENDING && (
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
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "BDT",
                          }).format(user.balance)}
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

            <TabsContent value="images">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">Document Images</h3>
                    <p className="text-gray-500">
                      {getDocumentTypeName(kycDocument.document_type)}{" "}
                      verification images
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Front of Document
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      {kycDocument.document_front_url ? (
                        <img
                          src={kycDocument.document_front_url}
                          alt="Front of document"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: "300px" }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-100">
                          <Image className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  {kycDocument.document_type !== DocumentType.PASSPORT && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Back of Document
                      </h4>
                      <div className="border rounded-md overflow-hidden">
                        {kycDocument.document_back_url ? (
                          <img
                            src={kycDocument.document_back_url}
                            alt="Back of document"
                            className="w-full h-auto object-contain"
                            style={{ maxHeight: "300px" }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-100">
                            <Image className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Selfie with Document
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      {kycDocument.selfie_url ? (
                        <img
                          src={kycDocument.selfie_url}
                          alt="Selfie with document"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: "300px" }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-100">
                          <Image className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Action Dialog - Approve or Reject */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve KYC Document"
                : "Reject KYC Document"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve the KYC document and mark the user as verified."
                : "This will reject the KYC document. The user will need to resubmit their documents."}
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
                  placeholder="Explain why this KYC document is being rejected"
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
                ? "Approve Document"
                : "Reject Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
