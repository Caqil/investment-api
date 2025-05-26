// investment-admin/app/payments/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PaymentDetails } from "@/components/payments/payment-details";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentDetailPageProps {
  params: {
    id: string;
  };
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const router = useRouter();
  const paymentId = parseInt(params.id, 10);
  const [error, setError] = useState<string | null>(null);

  // Validate that the ID is a number
  useEffect(() => {
    if (isNaN(paymentId)) {
      setError("Invalid payment ID");
    }
  }, [paymentId]);

  const handleBack = () => {
    router.push("/payments");
  };

  const handlePaymentAction = () => {
    // After a successful payment action, refresh the page or redirect
    router.refresh();
  };

  if (error) {
    return (
      <DashboardShell>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PaymentDetails
        paymentId={paymentId}
        onBack={handleBack}
        onPaymentAction={handlePaymentAction}
      />
    </DashboardShell>
  );
}
