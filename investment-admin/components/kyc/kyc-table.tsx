"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KYCDocument, KYCStatus, DocumentType } from "@/types/kyc";
import { formatDate } from "@/lib/utils";
import { FileSearch, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KYCTableProps {
  documents: KYCDocument[];
  loading: boolean;
  onViewDetails: (id: number) => void;
}

export function KYCTable({ documents, loading, onViewDetails }: KYCTableProps) {
  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case DocumentType.ID_CARD:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            ID Card
          </Badge>
        );
      case DocumentType.PASSPORT:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Passport
          </Badge>
        );
      case DocumentType.DRIVING_LICENSE:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Driving License
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            {type}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case KYCStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case KYCStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case KYCStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-12 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No KYC documents found.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.id}</TableCell>
                <TableCell>{doc.user_id}</TableCell>
                <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>{formatDate(doc.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-slate-100"
                      onClick={() => onViewDetails(doc.id)}
                    >
                      <FileSearch className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                    {doc.document_front_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a
                          href={doc.document_front_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View Document</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
