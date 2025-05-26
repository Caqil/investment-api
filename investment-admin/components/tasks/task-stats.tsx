"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Users, ThumbsUp, Download, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskStatsProps {
  stats: {
    totalTasks: number;
    mandatoryTasks: number;
    followTasks: number;
    likeTasks: number;
    installTasks: number;
  };
  loading: boolean;
}

export function TaskStats({ stats, loading }: TaskStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      <StatsCard
        title="Total Tasks"
        value={stats.totalTasks}
        icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      <StatsCard
        title="Required Tasks"
        value={stats.mandatoryTasks}
        icon={<ListChecks className="h-4 w-4 text-red-500" />}
        loading={loading}
      />
      <StatsCard
        title="Follow Tasks"
        value={stats.followTasks}
        icon={<Users className="h-4 w-4 text-blue-500" />}
        loading={loading}
      />
      <StatsCard
        title="Like Tasks"
        value={stats.likeTasks}
        icon={<ThumbsUp className="h-4 w-4 text-purple-500" />}
        loading={loading}
      />
      <StatsCard
        title="Install Tasks"
        value={stats.installTasks}
        icon={<Download className="h-4 w-4 text-green-500" />}
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
