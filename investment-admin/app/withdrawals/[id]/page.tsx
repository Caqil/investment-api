"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { WithdrawalDetails } from "@/components/withdrawals/withdrawal-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface WithdrawalDetailPageProps {
  params: {
    id: string;
  };
}

export default function WithdrawalDetailPage({
  params,
}: WithdrawalDetailPageProps) {
  const router = useRouter();
  const withdrawalId = parseInt(params.id, 10);
  const [error, setError] = useState<string | null>(null);

  // Validate that the ID is a number
  useEffect(() => {
    if (isNaN(withdrawalId)) {
      setError("Invalid withdrawal ID");
    }
  }, [withdrawalId]);

  const handleBack = () => {
    router.push("/withdrawals");
  };

  const handleWithdrawalAction = () => {
    // After a successful withdrawal action, redirect back to the list
    router.push("/withdrawals");
  };

  if (error) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Withdrawals
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
          Back to Withdrawals
        </Button>
      </div>

      <WithdrawalDetails
        withdrawalId={withdrawalId}
        onBack={handleBack}
        onAction={handleWithdrawalAction}
      />
    </DashboardShell>
  );
}
