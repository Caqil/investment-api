// src/components/kyc/kyc-table.tsx
import React from "react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { KYCDocument, DocumentType, KYCStatus } from "../../types/kyc";
import { formatDistanceToNow, format } from "date-fns";
import { DocumentViewer } from "./document-viewer";
import { ApproveKYCDialog } from "./approve-kyc-dialog";
import { RejectKYCDialog } from "./reject-kyc-dialog";

interface KYCTableProps {
  documents: KYCDocument[];
  isLoading: boolean;
  error: string | null;
  showActions?: boolean;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number, reason: string) => Promise<void>;
}

export function KYCTable({
  documents,
  isLoading,
  error,
  showActions = true,
  onApprove,
  onReject,
}: KYCTableProps) {
  // Format document type for display
  const formatDocumentType = (type: DocumentType) => {
    switch (type) {
      case "id_card":
        return "ID Card";
      case "passport":
        return "Passport";
      case "driving_license":
        return "Driving License";
      default:
        return type;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: KYCStatus) => {
    switch (status) {
      case "pending":
        return "outline";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            {showActions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 6 : 5}
                className="text-center text-muted-foreground py-6"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : documents.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 6 : 5}
                className="text-center text-muted-foreground py-6"
              >
                No KYC submissions found
              </TableCell>
            </TableRow>
          ) : (
            documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="font-medium">User #{document.user_id}</div>
                </TableCell>
                <TableCell>
                  {formatDocumentType(document.document_type)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DocumentViewer
                      title="Front Side"
                      imageUrl={document.document_front_url}
                    />

                    {document.document_back_url && (
                      <DocumentViewer
                        title="Back Side"
                        imageUrl={document.document_back_url}
                      />
                    )}

                    <DocumentViewer
                      title="Selfie"
                      imageUrl={document.selfie_url}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(document.created_at), "PP")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(document.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(document.status)}>
                    {document.status}
                  </Badge>
                  {document.admin_note && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Note: {document.admin_note}
                    </div>
                  )}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/kyc/${document.id}`} passHref>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>

                      {onApprove && (
                        <ApproveKYCDialog
                          document={document}
                          onApprove={onApprove}
                        />
                      )}

                      {onReject && (
                        <RejectKYCDialog
                          document={document}
                          onReject={onReject}
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
