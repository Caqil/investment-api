"use client";

import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface WithdrawalStatsProps {
  stats: {
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    recent_withdrawals: any[];
  };
  loading: boolean;
}

export function WithdrawalStats({ stats, loading }: WithdrawalStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Pending Withdrawals
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
              Approved Withdrawals
            </p>
            <h3 className="text-2xl font-bold">{stats.approved_count}</h3>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Rejected Withdrawals
            </p>
            <h3 className="text-2xl font-bold">{stats.rejected_count}</h3>
          </div>
        </div>
      </Card>
    </div>
  );
}
