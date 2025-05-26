// investment-admin/components/users/user-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, UserX, Users, Award, PieChart } from "lucide-react";

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    verifiedUsers: number; // KYC verified users
    planDistribution?: Array<{ name: string; value: number }>;
  };
  loading: boolean;
}

export function UserStats({ stats, loading }: UserStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Total registered accounts
          </p>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {stats.activeUsers > 0 && stats.totalUsers > 0
              ? `${Math.round(
                  (stats.activeUsers / stats.totalUsers) * 100
                )}% of total users`
              : "No active users"}
          </p>
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.blockedUsers}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {stats.blockedUsers > 0 && stats.totalUsers > 0
              ? `${Math.round(
                  (stats.blockedUsers / stats.totalUsers) * 100
                )}% of total users`
              : "No blocked users"}
          </p>
        </CardContent>
      </Card>

      {/* KYC Verified Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {stats.verifiedUsers > 0 && stats.totalUsers > 0
              ? `${Math.round(
                  (stats.verifiedUsers / stats.totalUsers) * 100
                )}% KYC verified`
              : "No verified users"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
