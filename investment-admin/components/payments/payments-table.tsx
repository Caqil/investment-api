"use client";

import {
  Payment,
  PaymentStatus,
  PaymentGateway,
  Currency,
} from "@/types/payment";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  onViewDetails: (id: number) => void;
}

export function PaymentsTable({
  payments,
  loading,
  onViewDetails,
}: PaymentsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of payments per page

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case PaymentStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Completed
          </Badge>
        );
      case PaymentStatus.FAILED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatGatewayName = (gateway: string) => {
    switch (gateway) {
      case PaymentGateway.COINGATE:
        return "CoinGate";
      case PaymentGateway.UDDOKTAPAY:
        return "UddoktaPay";
      case PaymentGateway.MANUAL:
        return "Manual";
      default:
        return gateway;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(payments.length / pageSize);
  const paginatedPayments = payments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-md p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 rounded w-1/4"></div>
              <div className="h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full p-3 mb-4">
            <Eye className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium">No payments found</h3>
          <p className="text-sm mt-1">
            There are no payment transactions matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Gateway
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Reference
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payment.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatGatewayName(payment.gateway)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatCurrency(payment.amount, payment.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {payment.gateway_reference
                    ? payment.gateway_reference.length > 12
                      ? `${payment.gateway_reference.substring(0, 12)}...`
                      : payment.gateway_reference
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getStatusBadge(payment.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDate(payment.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(payment.id)}
                    className="h-8 gap-1"
                  >
                    <Eye className="h-4n w-4" />
                    Details
                  </Button>

                  {payment.status === PaymentStatus.PENDING &&
                    payment.gateway === PaymentGateway.MANUAL && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(payment.id)}
                          className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 ml-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(payment.id)}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, payments.length)} of{" "}
            {payments.length} payments
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
