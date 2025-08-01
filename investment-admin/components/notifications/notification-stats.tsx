// investment-admin/components/notifications/notification-stats.tsx
"use client";

import { Card } from "@/components/ui/card";
import {
  Bell,
  BellOff,
  MessageCircle,
  DollarSign,
  Gift,
  Info,
} from "lucide-react";
import type { NotificationStats as NotificationStatsType } from "@/types/notification";

interface NotificationStatsProps {
  // Use the renamed type
  stats: NotificationStatsType | null;
  loading: boolean;
}

export function NotificationStats({ stats, loading }: NotificationStatsProps) {
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

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Notifications
            </p>
            <h3 className="text-2xl font-bold">{stats.total_count}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <BellOff className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Unread Notifications
            </p>
            <h3 className="text-2xl font-bold">{stats.unread_count}</h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-full">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Payment Notifications
            </p>
            <h3 className="text-2xl font-bold">
              {stats.deposit_count + stats.withdrawal_count}
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-purple-100 rounded-full">
            <MessageCircle className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              System Notifications
            </p>
            <h3 className="text-2xl font-bold">{stats.system_count}</h3>
          </div>
        </div>
      </Card>
    </div>
  );
}
