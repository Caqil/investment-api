"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { KYCDocument, KYCStatus, DocumentType } from "@/types/kyc";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { KYCTable } from "@/components/kyc/kyc-table";
import { KYCStats } from "@/components/kyc/kyc-stats";

interface KYCStats {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  recent_submissions: KYCDocument[];
}

export default function KYCPage() {
  const router = useRouter();
  const [kycDocuments, setKYCDocuments] = useState<KYCDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<KYCStats>({
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    recent_submissions: [],
  });

  const fetchKYCDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (activeTab === "pending") {
        response = await api.kyc.getPending();
      } else {
        // In a real app, you'd have specific endpoints for these
        response = await api.kyc.getAll();
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Filter documents by status if needed
      let fetchedDocuments = response.data?.kyc_documents || [];
      if (activeTab === "approved") {
        fetchedDocuments = fetchedDocuments.filter(
          (doc) => doc.status === KYCStatus.APPROVED
        );
      } else if (activeTab === "rejected") {
        fetchedDocuments = fetchedDocuments.filter(
          (doc) => doc.status === KYCStatus.REJECTED
        );
      }

      setKYCDocuments(fetchedDocuments);

      // Calculate stats from fetched data
      const pendingCount = fetchedDocuments.filter(
        (doc) => doc.status === KYCStatus.PENDING
      ).length;
      const approvedCount = fetchedDocuments.filter(
        (doc) => doc.status === KYCStatus.APPROVED
      ).length;
      const rejectedCount = fetchedDocuments.filter(
        (doc) => doc.status === KYCStatus.REJECTED
      ).length;

      // Get recent submissions (latest 5)
      const recentSubmissions = [...fetchedDocuments]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      setStats({
        pending_count: pendingCount,
        approved_count: approvedCount,
        rejected_count: rejectedCount,
        recent_submissions: recentSubmissions,
      });
    } catch (err) {
      console.error("Error fetching KYC documents:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load KYC documents"
      );
      setKYCDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCDocuments();
  }, [activeTab, refreshTrigger]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...kycDocuments];

    // Apply document type filter
    if (documentTypeFilter !== "all") {
      result = result.filter((doc) => doc.document_type === documentTypeFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.id.toString().includes(query) ||
          doc.user_id.toString().includes(query)
      );
    }

    setFilteredDocuments(result);
  }, [kycDocuments, documentTypeFilter, searchQuery]);

  const handleViewDocument = (id: number) => {
    router.push(`/kyc/${id}`);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Get unique document types for filter
  const documentTypes = Array.from(
    new Set(kycDocuments.map((doc) => doc.document_type))
  );

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">KYC Management</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KYC Statistics */}
      <KYCStats stats={stats} loading={loading} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by ID, user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>
        <Select
          value={documentTypeFilter}
          onValueChange={setDocumentTypeFilter}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type === DocumentType.ID_CARD
                  ? "ID Card"
                  : type === DocumentType.PASSPORT
                  ? "Passport"
                  : type === DocumentType.DRIVING_LICENSE
                  ? "Driving License"
                  : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for filtering by status */}
      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <KYCTable
            documents={filteredDocuments}
            loading={loading}
            onViewDetails={handleViewDocument}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <KYCTable
            documents={filteredDocuments}
            loading={loading}
            onViewDetails={handleViewDocument}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <KYCTable
            documents={filteredDocuments}
            loading={loading}
            onViewDetails={handleViewDocument}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <KYCTable
            documents={filteredDocuments}
            loading={loading}
            onViewDetails={handleViewDocument}
          />
        </TabsContent>
      </Tabs>

      {filteredDocuments.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No KYC documents found</CardTitle>
            <CardDescription>
              {searchQuery || documentTypeFilter !== "all"
                ? "Try adjusting your filters"
                : `There are no ${activeTab} KYC documents to display`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </DashboardShell>
  );
}
