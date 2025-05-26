"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KYCDocument } from "@/types/kyc";

interface KYCStatsProps {
  stats: {
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    recent_submissions: KYCDocument[];
  };
  loading: boolean;
}

export function KYCStats({ stats, loading }: KYCStatsProps) {
  const totalCount =
    stats.pending_count + stats.approved_count + stats.rejected_count;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatsCard
        title="Total KYC Submissions"
        value={totalCount}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <StatsCard
        title="Pending Verification"
        value={stats.pending_count}
        icon={<Clock className="h-4 w-4 text-yellow-500" />}
        loading={loading}
      />
      <StatsCard
        title="Approved"
        value={stats.approved_count}
        icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        loading={loading}
      />
      <StatsCard
        title="Rejected"
        value={stats.rejected_count}
        icon={<XCircle className="h-4 w-4 text-red-500" />}
        loading={loading}
      />
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}

function StatsCard({ title, value, icon, loading }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
