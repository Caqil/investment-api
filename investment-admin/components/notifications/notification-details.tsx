// investment-admin/components/notifications/notification-details.tsx
"use client";

import { Notification, NotificationType } from "@/types/notification";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Check, Trash, ArrowLeft } from "lucide-react";

interface NotificationDetailsProps {
  notification: Notification;
  onBack: () => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationDetails({
  notification,
  onBack,
  onMarkAsRead,
  onDelete,
}: NotificationDetailsProps) {
  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WITHDRAWAL:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Withdrawal
          </Badge>
        );
      case NotificationType.DEPOSIT:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Deposit
          </Badge>
        );
      case NotificationType.BONUS:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Bonus
          </Badge>
        );
      case NotificationType.SYSTEM:
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
          >
            System
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WITHDRAWAL:
        return <Bell className="h-8 w-8 text-red-500" />;
      case NotificationType.DEPOSIT:
        return <Bell className="h-8 w-8 text-green-500" />;
      case NotificationType.BONUS:
        return <Bell className="h-8 w-8 text-yellow-500" />;
      case NotificationType.SYSTEM:
        return <Bell className="h-8 w-8 text-blue-500" />;
      default:
        return <Bell className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {getTypeIcon(notification.type)}
            <div>
              <h2 className="text-2xl font-bold">{notification.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-gray-500">
                  Sent on {formatDate(notification.created_at)}
                </p>
                <span className="text-gray-400">•</span>
                <p className="text-gray-500">User ID: {notification.user_id}</p>
                <span className="text-gray-400">•</span>
                {getTypeBadge(notification.type)}
              </div>
            </div>
          </div>
          <div>
            {notification.is_read ? (
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                Read
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Unread
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <p className="whitespace-pre-line">{notification.message}</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="space-x-2">
            {!notification.is_read && (
              <Button
                variant="outline"
                onClick={() => onMarkAsRead(notification.id)}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Mark as Read
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={() => onDelete(notification.id)}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
