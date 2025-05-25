"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KYCTable } from "@/components/kyc/kyc-table";
import { kycApi } from "@/lib/api";
import { KYCDocument } from "@/types/kyc";
import { useToast } from "@/components/ui/use-toast";

export default function KYCPage() {
  const [pendingKYC, setPendingKYC] = useState<KYCDocument[]>([]);
  const [approvedKYC, setApprovedKYC] = useState<KYCDocument[]>([]);
  const [rejectedKYC, setRejectedKYC] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch KYC data
  useEffect(() => {
    const fetchKYCData = async () => {
      try {
        setIsLoading(true);

        // Fetch KYC submissions by status
        const pendingData = await kycApi.getAll({ status: "pending" });
        const approvedData = await kycApi.getAll({ status: "approved" });
        const rejectedData = await kycApi.getAll({ status: "rejected" });

        setPendingKYC(pendingData);
        setApprovedKYC(approvedData);
        setRejectedKYC(rejectedData);

        setError(null);
      } catch (error) {
        console.error("Error fetching KYC data:", error);
        setError("Failed to load KYC submissions");
        toast({
          title: "Error",
          description: "Failed to load KYC submissions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchKYCData();
  }, [toast]);

  // Handle KYC approval
  const handleApproveKYC = async (id: number) => {
    try {
      await kycApi.approve(id);

      // Move KYC from pending to approved
      const kyc = pendingKYC.find((k) => k.id === id);
      if (kyc) {
        setPendingKYC(pendingKYC.filter((k) => k.id !== id));
        setApprovedKYC([{ ...kyc, status: "approved" }, ...approvedKYC]);
      }

      toast({
        title: "Success",
        description: "KYC submission has been approved",
      });
    } catch (error) {
      console.error("Error approving KYC:", error);
      toast({
        title: "Error",
        description: "Failed to approve KYC submission",
        variant: "destructive",
      });
    }
  };

  // Handle KYC rejection
  const handleRejectKYC = async (id: number, reason: string) => {
    try {
      await kycApi.reject(id, reason);

      // Move KYC from pending to rejected
      const kyc = pendingKYC.find((k) => k.id === id);
      if (kyc) {
        setPendingKYC(pendingKYC.filter((k) => k.id !== id));
        setRejectedKYC([
          { ...kyc, status: "rejected", admin_note: reason },
          ...rejectedKYC,
        ]);
      }

      toast({
        title: "Success",
        description: "KYC submission has been rejected",
      });
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      toast({
        title: "Error",
        description: "Failed to reject KYC submission",
        variant: "destructive",
      });
    }
  };

  // Calculate approval rate
  const approvalRate =
    approvedKYC.length + rejectedKYC.length > 0
      ? Math.round(
          (approvedKYC.length / (approvedKYC.length + rejectedKYC.length)) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">KYC Verification</h2>
        <p className="text-muted-foreground">
          Manage Know Your Customer (KYC) verification submissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <CardDescription>Awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKYC.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CardDescription>Verified users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedKYC.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CardDescription>Overall percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <KYCTable
            documents={pendingKYC}
            isLoading={isLoading}
            error={error}
            onApprove={handleApproveKYC}
            onReject={handleRejectKYC}
          />
        </TabsContent>

        <TabsContent value="approved">
          <KYCTable
            documents={approvedKYC}
            isLoading={isLoading}
            error={error}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <KYCTable
            documents={rejectedKYC}
            isLoading={isLoading}
            error={error}
            showActions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
