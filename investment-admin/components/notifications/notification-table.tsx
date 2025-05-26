// investment-admin/components/notifications/notification-table.tsx
"use client";

import { Notification, NotificationType } from "@/types/notification";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Eye, Check, Trash } from "lucide-react";

interface NotificationTableProps {
  notifications: Notification[];
  loading: boolean;
  onView: (notification: Notification) => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationTable({
  notifications,
  loading,
  onView,
  onMarkAsRead,
  onDelete,
}: NotificationTableProps) {
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

  if (loading) {
    return (
      <div className="border rounded-md p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Bell className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No notifications found</h3>
          <p className="text-sm text-gray-500 mt-1">
            There are no notifications matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                User ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notifications.map((notification) => (
              <tr
                key={notification.id}
                className={notification.is_read ? "" : "bg-blue-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {notification.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {notification.user_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {notification.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getTypeBadge(notification.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {notification.is_read ? (
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-800"
                    >
                      Read
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800"
                    >
                      Unread
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(notification.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(notification)}
                    className="h-8 gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>

                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                      className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-2"
                    >
                      <Check className="h-4 w-4" />
                      Mark Read
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(notification.id)}
                    className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                  >
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
