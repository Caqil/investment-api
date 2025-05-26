// investment-admin/components/layout/header-notifications.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { Notification, NotificationType } from "@/types/notification";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export function HeaderNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.userNotifications.getAll(5, 0); // Get 5 most recent
      if (!response.error && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.userNotifications.getUnreadCount();
      if (!response.error && response.data) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up a polling interval to update the count (every 30 seconds)
    const intervalId = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Mark a notification as read
  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.userNotifications.markAsRead(id);
      if (!response.error) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.userNotifications.markAllAsRead();
      if (!response.error) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            is_read: true,
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // View all notifications
  const handleViewAll = () => {
    router.push("/notifications");
  };

  // Get icon and color for notification type
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WITHDRAWAL:
        return { colorClass: "bg-red-100 text-red-600" };
      case NotificationType.DEPOSIT:
        return { colorClass: "bg-green-100 text-green-600" };
      case NotificationType.BONUS:
        return { colorClass: "bg-yellow-100 text-yellow-600" };
      case NotificationType.SYSTEM:
        return { colorClass: "bg-blue-100 text-blue-600" };
      default:
        return { colorClass: "bg-gray-100 text-gray-600" };
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]"
              variant="default"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const { colorClass } = getNotificationStyle(notification.type);
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start p-3 ${
                      !notification.is_read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div
                        className={`h-2 w-2 rounded-full mt-1.5 ${colorClass}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {notification.title}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) =>
                                handleMarkAsRead(notification.id, e)
                              }
                              className="h-6 text-xs px-2 text-blue-600"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </DropdownMenuGroup>
        </ScrollArea>
        <DropdownMenuSeparator />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleViewAll}
          >
            View all notifications
          </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
