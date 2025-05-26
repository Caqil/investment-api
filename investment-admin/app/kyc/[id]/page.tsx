"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KYCDetails } from "@/components/kyc/kyc-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface KYCDetailPageProps {
  params: {
    id: string;
  };
}

export default function KYCDetailPage({ params }: KYCDetailPageProps) {
  const router = useRouter();
  const kycId = parseInt(params.id, 10);
  const [error, setError] = useState<string | null>(null);

  // Validate that the ID is a number
  useEffect(() => {
    if (isNaN(kycId)) {
      setError("Invalid KYC document ID");
    }
  }, [kycId]);

  const handleBack = () => {
    router.push("/kyc");
  };

  const handleKYCAction = () => {
    // After a successful KYC action, redirect back to the list
    router.push("/kyc");
  };

  if (error) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to KYC
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to KYC
        </Button>
      </div>

      <KYCDetails
        kycId={kycId}
        onBack={handleBack}
        onAction={handleKYCAction}
      />
    </DashboardShell>
  );
}
