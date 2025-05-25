// src/components/dashboard/kyc-stats.tsx
import React from "react";
import { Progress } from "../ui/progress";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface KYCStatsProps {
  pendingCount: number;
  approvalRate: number;
}

export function KYCStats({ pendingCount, approvalRate }: KYCStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verification</CardTitle>
        <CardDescription>Current KYC verification statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pending Verifications</p>
            <p className="text-sm font-medium">{pendingCount}</p>
          </div>
          {pendingCount > 0 && (
            <Progress
              value={100}
              className="h-2 bg-orange-100 dark:bg-orange-900"
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Approval Rate</p>
            <p className="text-sm font-medium">{approvalRate}%</p>
          </div>
          <Progress value={approvalRate} className="h-2" />
        </div>

        <div className="pt-4">
          <Link href="/kyc" className="text-sm text-primary hover:underline">
            View all KYC submissions
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
