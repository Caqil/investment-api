"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

interface PaymentStatsProps {
  stats: {
    total_payments: number;
    total_amount: number;
    pending_count: number;
    completed_count: number;
    failed_count: number;
    manual_count?: number; // Make optional
    coingate_count?: number; // Make optional
    uddoktapay_count?: number; // Make optional
  };
  loading: boolean;
}

export function PaymentStats({ stats, loading }: PaymentStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-indigo-100 rounded-full">
            <DollarSign className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <h3 className="text-2xl font-bold">
              {formatCurrency(stats.total_amount, "BDT")}
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Pending Payments
            </p>
            <h3 className="text-2xl font-bold">{stats.pending_count}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Completed Payments
            </p>
            <h3 className="text-2xl font-bold">{stats.completed_count}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Failed Payments</p>
            <h3 className="text-2xl font-bold">{stats.failed_count}</h3>
          </div>
        </div>
      </Card>
    </div>
  );
}
