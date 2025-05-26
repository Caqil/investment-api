"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import { DocumentType, KYCStatus } from "@/types/kyc";
import {
  CheckCircle,
  Upload,
  Clock,
  AlertCircle,
  Info,
  Camera,
  FileText,
  BadgeCheck,
  X,
} from "lucide-react";
import { Step, Steps } from "@/components/ui/steps";

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [kycDocument, setKycDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [documentType, setDocumentType] = useState<DocumentType>(
    DocumentType.ID_CARD
  );
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch KYC status
  useEffect(() => {
    const fetchKYCStatus = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await userApi.kyc.getStatus();

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          if (response.data.kyc_submitted) {
            setKycStatus(response.data.kyc?.status || null);
            setKycDocument(response.data.kyc);
          } else {
            setKycStatus(null);
          }
        }
      } catch (err) {
        console.error("Error fetching KYC status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load KYC status"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchKYCStatus();
  }, []);

  // Handle KYC submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!documentFrontUrl) {
        throw new Error("Please provide the front side of your document");
      }

      if (documentType === DocumentType.ID_CARD && !documentBackUrl) {
        throw new Error("Please provide the back side of your ID card");
      }

      if (!selfieUrl) {
        throw new Error("Please provide a selfie photo");
      }

      const response = await userApi.kyc.submit({
        document_type: documentType,
        document_front_url: documentFrontUrl,
        document_back_url: documentBackUrl,
        selfie_url: selfieUrl,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccessMessage("KYC documents submitted successfully");

      // Update state with new KYC document
      setKycDocument(response.data?.kyc);
      setKycStatus(KYCStatus.PENDING);

      // Reset form
      setDocumentType(DocumentType.ID_CARD);
      setDocumentFrontUrl("");
      setDocumentBackUrl("");
      setSelfieUrl("");
    } catch (err) {
      console.error("Error submitting KYC:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit KYC documents"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render status badge
  const renderStatusBadge = (status: KYCStatus | null) => {
    if (!status) return null;

    switch (status) {
      case KYCStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case KYCStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case KYCStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  // Show different UI based on KYC status
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-24 w-full bg-muted rounded animate-pulse"></div>
          <div className="h-12 w-32 bg-muted rounded animate-pulse"></div>
        </div>
      );
    }

    if (kycStatus === KYCStatus.APPROVED) {
      return (
        <div className="space-y-6">
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your KYC verification has been approved. You now have full access
              to all platform features.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4">
            <div className="flex items-center mb-4">
              <BadgeCheck className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">Verification Details</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Document Type</span>
                <span className="font-medium">
                  {kycDocument?.document_type?.replace("_", " ") ||
                    "Not available"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Verified On</span>
                <span className="font-medium">
                  {kycDocument
                    ? formatDate(kycDocument.created_at)
                    : "Not available"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-green-600">Verified</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (kycStatus === KYCStatus.PENDING) {
      return (
        <div className="space-y-6">
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
            <Clock className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              Your KYC verification is being reviewed. This usually takes 24-48
              hours.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4">
            <Steps active={1} vertical>
              <Step
                title="Documents Submitted"
                description="You've submitted your verification documents"
                icon={CheckCircle}
              />
              <Step
                title="Under Review"
                description="Our team is reviewing your documents"
                icon={Clock}
              />
              <Step
                title="Verification Complete"
                description="Your identity will be verified"
                icon={BadgeCheck}
              />
            </Steps>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center mb-4">
              <Info className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Submission Details</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Document Type</span>
                <span className="font-medium">
                  {kycDocument?.document_type?.replace("_", " ") ||
                    "Not available"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Submitted On</span>
                <span className="font-medium">
                  {kycDocument
                    ? formatDate(kycDocument.created_at)
                    : "Not available"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-yellow-600">Pending</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (kycStatus === KYCStatus.REJECTED) {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your KYC verification was rejected. Please submit new documents.
              {kycDocument?.admin_note && (
                <div className="mt-2 font-medium">
                  Reason: {kycDocument.admin_note}
                </div>
              )}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Submit New Documents</CardTitle>
              <CardDescription>
                Please provide clear images of your identification documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderKYCForm()}
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default: No KYC submitted yet
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <CardDescription>
            Please provide clear images of your identification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderKYCForm()}
          </form>
        </CardContent>
      </Card>
    );
  };

  // Render KYC form
  const renderKYCForm = () => {
    return (
      <>
        <div className="space-y-3">
          <Label>Document Type</Label>
          <RadioGroup
            value={documentType}
            onValueChange={(value) => setDocumentType(value as DocumentType)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value={DocumentType.ID_CARD} id="id_card" />
              <Label htmlFor="id_card" className="cursor-pointer">
                National ID Card
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value={DocumentType.PASSPORT} id="passport" />
              <Label htmlFor="passport" className="cursor-pointer">
                Passport
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem
                value={DocumentType.DRIVING_LICENSE}
                id="driving_license"
              />
              <Label htmlFor="driving_license" className="cursor-pointer">
                Driving License
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label htmlFor="documentFront">
            Front Side of{" "}
            {documentType === DocumentType.ID_CARD
              ? "ID Card"
              : documentType === DocumentType.PASSPORT
              ? "Passport"
              : "Driving License"}
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                id="documentFront"
                placeholder="Enter URL for document front side"
                value={documentFrontUrl}
                onChange={(e) => setDocumentFrontUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a URL to your document image (upload to a hosting service
                first)
              </p>
            </div>
            <div className="flex items-center justify-center border rounded-md p-4 aspect-video bg-muted/50">
              {documentFrontUrl ? (
                <img
                  src={documentFrontUrl}
                  alt="Document Front"
                  className="max-h-full object-contain"
                  onError={() => {
                    /* Handle image error */
                  }}
                />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {documentType === DocumentType.ID_CARD && (
          <div className="space-y-3">
            <Label htmlFor="documentBack">Back Side of ID Card</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <Input
                  id="documentBack"
                  placeholder="Enter URL for document back side"
                  value={documentBackUrl}
                  onChange={(e) => setDocumentBackUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a URL to your document image (upload to a hosting
                  service first)
                </p>
              </div>
              <div className="flex items-center justify-center border rounded-md p-4 aspect-video bg-muted/50">
                {documentBackUrl ? (
                  <img
                    src={documentBackUrl}
                    alt="Document Back"
                    className="max-h-full object-contain"
                    onError={() => {
                      /* Handle image error */
                    }}
                  />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="selfie">Selfie with Document</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                id="selfie"
                placeholder="Enter URL for selfie with document"
                value={selfieUrl}
                onChange={(e) => setSelfieUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Take a photo of yourself holding the ID document
              </p>
            </div>
            <div className="flex items-center justify-center border rounded-md p-4 aspect-video bg-muted/50">
              {selfieUrl ? (
                <img
                  src={selfieUrl}
                  alt="Selfie"
                  className="max-h-full object-contain"
                  onError={() => {
                    /* Handle image error */
                  }}
                />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Documents
              </>
            )}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">KYC Verification</h2>
        <p className="text-muted-foreground">
          Verify your identity to unlock all platform features
        </p>
      </div>

      {/* Status Display */}
      <div className="flex items-center space-x-2">
        <span className="text-sm">Verification Status:</span>
        {renderStatusBadge(kycStatus) || (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <Info className="h-3 w-3 mr-1" />
            Not Submitted
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Main content based on KYC status */}
      {renderContent()}

      {/* KYC Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <h3 className="font-medium mb-2">Document Requirements</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>All documents must be valid and not expired</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>
                    Photos must be clear, in focus, and all information should
                    be readable
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>The entire document must be visible in the images</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>
                    Selfie must clearly show your face alongside the document
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="font-medium mb-2">Processing Time</h3>
              <p className="text-sm">
                Verification typically takes 24-48 hours to complete. You'll
                receive a notification once your documents have been reviewed.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="font-medium mb-2">Privacy & Security</h3>
              <p className="text-sm">
                Your documents are securely stored and used only for
                verification purposes. We adhere to strict data protection
                standards to keep your information safe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
