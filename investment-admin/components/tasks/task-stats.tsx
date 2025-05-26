"use client";

import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  Users,
  Download,
} from "lucide-react";

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
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <h3 className="text-2xl font-bold">{stats.totalTasks}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Mandatory Tasks</p>
            <h3 className="text-2xl font-bold">{stats.mandatoryTasks}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-purple-100 rounded-full">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Follow Tasks</p>
            <h3 className="text-2xl font-bold">{stats.followTasks}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-full">
            <ThumbsUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Like Tasks</p>
            <h3 className="text-2xl font-bold">{stats.likeTasks}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-red-100 rounded-full">
            <Download className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Install Tasks</p>
            <h3 className="text-2xl font-bold">{stats.installTasks}</h3>
          </div>
        </div>
      </Card>
    </div>
  );
}
