// app/user/kyc/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-provider";
import { userApi } from "@/lib/user-api";
import { toast } from "sonner";
import {
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

// KYC submission schema
const kycSchema = z.object({
  document_type: z.enum(["id_card", "passport", "driving_license"]),
  document_front_url: z
    .string()
    .min(1, "Front side document image is required"),
  document_back_url: z.string().optional(),
  selfie_url: z.string().min(1, "Selfie image is required"),
});

export default function KYCPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<{
    kyc_submitted: boolean;
    kyc?: {
      id: number;
      document_type: string;
      document_front_url: string;
      document_back_url?: string;
      selfie_url: string;
      status: string;
      admin_note?: string;
      created_at: string;
    };
  } | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof kycSchema>>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      document_type: "id_card",
      document_front_url: "",
      document_back_url: "",
      selfie_url: "",
    },
  });

  // Watch document type to determine if back side is required
  const documentType = form.watch("document_type");

  // Fetch KYC status
  useEffect(() => {
    async function fetchKYCStatus() {
      try {
        const response = await userApi.getKYCStatus();
        setKycStatus(response.data);

        // If KYC has been submitted, pre-fill the form
        if (response.data.kyc_submitted && response.data.kyc) {
          form.setValue("document_type", response.data.kyc.document_type);
          form.setValue(
            "document_front_url",
            response.data.kyc.document_front_url
          );
          form.setValue(
            "document_back_url",
            response.data.kyc.document_back_url || ""
          );
          form.setValue("selfie_url", response.data.kyc.selfie_url);
        }
      } catch (error) {
        console.error("Error fetching KYC status:", error);
        toast.error("Failed to load KYC status");
      } finally {
        setIsLoading(false);
      }
    }

    fetchKYCStatus();
  }, [form]);

  // Handle KYC submission
  const onSubmit = async (data: z.infer<typeof kycSchema>) => {
    // Check if back side is required but not provided
    if (data.document_type === "id_card" && !data.document_back_url) {
      toast.error("Please upload both sides of your ID card");
      return;
    }

    setIsLoading(true);
    try {
      await userApi.submitKYC(data);

      // Update KYC status
      const response = await userApi.getKYCStatus();
      setKycStatus(response.data);

      toast.success("KYC documents submitted successfully");
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("Failed to submit KYC documents");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast.error("Only JPEG and PNG images are allowed");
      return;
    }

    setUploading(field);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("image", file);

      // Upload image
      const response = await userApi.uploadKYCDocument(formData);

      // Update form with new image URL
      form.setValue(field as any, response.data.url);

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  // Helper function to get document type display name
  const getDocumentTypeName = (type: string): string => {
    switch (type) {
      case "id_card":
        return "National ID Card";
      case "passport":
        return "Passport";
      case "driving_license":
        return "Driving License";
      default:
        return type;
    }
  };

  // Helper function to get status badge style
  const getStatusBadgeStyle = (status: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>

      {/* Display KYC status if submitted */}
      {kycStatus?.kyc_submitted && kycStatus.kyc && (
        <Alert
          className={`border ${
            kycStatus.kyc.status === "approved"
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              : kycStatus.kyc.status === "rejected"
              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
          }`}
        >
          {kycStatus.kyc.status === "approved" ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : kycStatus.kyc.status === "rejected" ? (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
          <AlertTitle>
            KYC Verification{" "}
            {kycStatus.kyc.status === "approved"
              ? "Approved"
              : kycStatus.kyc.status === "rejected"
              ? "Rejected"
              : "Pending"}
          </AlertTitle>
          <AlertDescription>
            {kycStatus.kyc.status === "approved"
              ? "Your KYC verification has been approved. You are now fully verified."
              : kycStatus.kyc.status === "rejected"
              ? `Your KYC verification was rejected. Reason: ${
                  kycStatus.kyc.admin_note || "No reason provided"
                }. Please submit again with valid documents.`
              : "Your KYC verification is currently under review. This process usually takes 24-48 hours."}
          </AlertDescription>
        </Alert>
      )}

      {/* KYC submission form - show only if not approved */}
      {(!kycStatus?.kyc_submitted ||
        (kycStatus.kyc && kycStatus.kyc.status !== "approved")) && (
        <Card>
          <CardHeader>
            <CardTitle>Submit KYC Documents</CardTitle>
            <CardDescription>
              Verify your identity by submitting the required documents
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4 bg-muted/50">
                <div className="font-medium">Why KYC is Required?</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>KYC (Know Your Customer) verification is required to:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Prevent fraud and ensure account security</li>
                    <li>Comply with regulatory requirements</li>
                    <li>Enable full access to withdrawal features</li>
                    <li>Verify your identity as the rightful account owner</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Document Type</Label>
                <RadioGroup
                  defaultValue={form.getValues().document_type}
                  onValueChange={(value) =>
                    form.setValue("document_type", value as any)
                  }
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="id_card"
                      id="id_card"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="id_card"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <FileCheck className="h-10 w-10 mb-2" />
                      National ID Card
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="passport"
                      id="passport"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="passport"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <FileCheck className="h-10 w-10 mb-2" />
                      Passport
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="driving_license"
                      id="driving_license"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="driving_license"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <FileCheck className="h-10 w-10 mb-2" />
                      Driving License
                    </Label>
                  </div>
                </RadioGroup>
                {form.formState.errors.document_type && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.document_type.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Upload Documents</h3>

                <div className="space-y-2">
                  <Label htmlFor="document_front">
                    Front Side of {getDocumentTypeName(documentType)}
                  </Label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {form.watch("document_front_url") && (
                      <div className="relative h-40 w-64 rounded-md overflow-hidden border">
                        <img
                          src={form.watch("document_front_url")}
                          alt="Document Front"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-40 w-64"
                      onClick={() =>
                        document.getElementById("document_front")?.click()
                      }
                      disabled={!!uploading}
                    >
                      {uploading === "document_front_url" ? (
                        <div className="flex flex-col items-center">
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                          <span className="mt-2">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-6 w-6 mb-2" />
                          <span>Upload Front Side</span>
                        </div>
                      )}
                    </Button>
                    <input
                      type="file"
                      id="document_front"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={(e) =>
                        handleImageUpload(e, "document_front_url")
                      }
                    />
                  </div>
                  {form.formState.errors.document_front_url && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.document_front_url.message}
                    </p>
                  )}
                </div>

                {documentType === "id_card" && (
                  <div className="space-y-2">
                    <Label htmlFor="document_back">
                      Back Side of {getDocumentTypeName(documentType)}
                    </Label>
                    <div className="flex items-center gap-4 flex-wrap">
                      {form.watch("document_back_url") && (
                        <div className="relative h-40 w-64 rounded-md overflow-hidden border">
                          <img
                            src={form.watch("document_back_url")}
                            alt="Document Back"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-40 w-64"
                        onClick={() =>
                          document.getElementById("document_back")?.click()
                        }
                        disabled={!!uploading}
                      >
                        {uploading === "document_back_url" ? (
                          <div className="flex flex-col items-center">
                            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                            <span className="mt-2">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-6 w-6 mb-2" />
                            <span>Upload Back Side</span>
                          </div>
                        )}
                      </Button>
                      <input
                        type="file"
                        id="document_back"
                        className="hidden"
                        accept="image/jpeg,image/png"
                        onChange={(e) =>
                          handleImageUpload(e, "document_back_url")
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="selfie">
                    Selfie with {getDocumentTypeName(documentType)}
                  </Label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {form.watch("selfie_url") && (
                      <div className="relative h-40 w-64 rounded-md overflow-hidden border">
                        <img
                          src={form.watch("selfie_url")}
                          alt="Selfie"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-40 w-64"
                      onClick={() => document.getElementById("selfie")?.click()}
                      disabled={!!uploading}
                    >
                      {uploading === "selfie_url" ? (
                        <div className="flex flex-col items-center">
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                          <span className="mt-2">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-6 w-6 mb-2" />
                          <span>Upload Selfie</span>
                        </div>
                      )}
                    </Button>
                    <input
                      type="file"
                      id="selfie"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={(e) => handleImageUpload(e, "selfie_url")}
                    />
                  </div>
                  {form.formState.errors.selfie_url && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.selfie_url.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Take a selfie while holding your ID document clearly visible
                    beside your face.
                  </p>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle>Important Information</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Make sure all document details are clearly visible</li>
                    <li>Ensure the images are well-lit and not blurry</li>
                    <li>Images should be less than 5MB in size</li>
                    <li>Supported formats: JPEG, PNG</li>
                    <li>Processing typically takes 24-48 hours</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  !!uploading ||
                  !form.getValues().document_front_url ||
                  !form.getValues().selfie_url ||
                  (documentType === "id_card" &&
                    !form.getValues().document_back_url)
                }
              >
                {isLoading ? "Submitting..." : "Submit KYC Documents"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Show KYC documents if already submitted */}
      {kycStatus?.kyc_submitted && kycStatus.kyc && (
        <Card>
          <CardHeader>
            <CardTitle>Submitted Documents</CardTitle>
            <CardDescription>
              Document Type: {getDocumentTypeName(kycStatus.kyc.document_type)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Front Side</Label>
                <div className="h-48 w-full rounded-md overflow-hidden border">
                  <img
                    src={kycStatus.kyc.document_front_url}
                    alt="Document Front"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {kycStatus.kyc.document_back_url && (
                <div className="space-y-2">
                  <Label>Back Side</Label>
                  <div className="h-48 w-full rounded-md overflow-hidden border">
                    <img
                      src={kycStatus.kyc.document_back_url}
                      alt="Document Back"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Selfie</Label>
                <div className="h-48 w-full rounded-md overflow-hidden border">
                  <img
                    src={kycStatus.kyc.selfie_url}
                    alt="Selfie"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center">
              <div className="text-sm mr-2">Status:</div>
              <div
                className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusBadgeStyle(
                  kycStatus.kyc.status
                )}`}
              >
                {kycStatus.kyc.status.charAt(0).toUpperCase() +
                  kycStatus.kyc.status.slice(1)}
              </div>
              <div className="text-sm ml-4 text-muted-foreground">
                Submitted on{" "}
                {new Date(kycStatus.kyc.created_at).toLocaleDateString()}
              </div>
            </div>

            {kycStatus.kyc.admin_note &&
              kycStatus.kyc.status === "rejected" && (
                <div className="mt-4 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="font-medium text-red-800 dark:text-red-400">
                    Rejection Reason:
                  </div>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {kycStatus.kyc.admin_note}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
