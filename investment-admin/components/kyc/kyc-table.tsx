"use client";

import { KYCDocument, KYCStatus, DocumentType } from "@/types/kyc";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle } from "lucide-react";

interface KYCTableProps {
  documents: KYCDocument[];
  loading: boolean;
  onViewDetails: (id: number) => void;
}

export function KYCTable({ documents, loading, onViewDetails }: KYCTableProps) {
  const getStatusBadge = (status: KYCStatus) => {
    switch (status) {
      case KYCStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case KYCStatus.APPROVED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Approved
          </Badge>
        );
      case KYCStatus.REJECTED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case DocumentType.ID_CARD:
        return "ID Card";
      case DocumentType.PASSPORT:
        return "Passport";
      case DocumentType.DRIVING_LICENSE:
        return "Driving License";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="border rounded-md p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Eye className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No KYC documents found</h3>
          <p className="text-sm text-gray-500 mt-1">
            There are no KYC documents matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                User ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Document Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Submission Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {document.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {document.user_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getDocumentTypeName(document.document_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getStatusBadge(document.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(document.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(document.id)}
                    className="h-8 gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>

                  {document.status === KYCStatus.PENDING && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(document.id)}
                        className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 ml-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(document.id)}
                        className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
