"use client";

import { useState } from "react";
import { Payment, PaymentStatus, PaymentGateway } from "@/types/payment";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { PaginationWrapper } from "@/components/ui/pagination-wrapper";

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  onViewDetails: (id: number) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export function PaymentsTable({
  payments,
  loading,
  onViewDetails,
  onApprove,
  onReject,
}: PaymentsTableProps) {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = payments.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get current page data
  const currentPayments = payments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>;
      case PaymentStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case PaymentStatus.FAILED:
        return <Badge variant="destructive">Failed</Badge>;
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

  if (loading) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
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
              {currentPayments.map((payment) => (
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
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>

                    {payment.status === PaymentStatus.PENDING &&
                      payment.gateway === PaymentGateway.MANUAL && (
                        <>
                          {onApprove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onApprove(payment.id)}
                              className="h-8 gap-1 ml-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          {onReject && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onReject(payment.id)}
                              className="h-8 gap-1 ml-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          )}
                        </>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <PaginationWrapper
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        pageSize={pageSize}
        className="border-t pt-4"
      />
    </div>
  );
}
