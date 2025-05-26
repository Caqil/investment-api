"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import { Notification, NotificationType } from "@/types/notification";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Wallet,
  CircleCheck,
  Gift,
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [readingNotificationId, setReadingNotificationId] = useState<
    number | null
  >(null);

  // Filtered notifications
  const [unreadNotifications, setUnreadNotifications] = useState<
    Notification[]
  >([]);
  const [depositNotifications, setDepositNotifications] = useState<
    Notification[]
  >([]);
  const [withdrawalNotifications, setWithdrawalNotifications] = useState<
    Notification[]
  >([]);
  const [bonusNotifications, setBonusNotifications] = useState<Notification[]>(
    []
  );
  const [systemNotifications, setSystemNotifications] = useState<
    Notification[]
  >([]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await userApi.notifications.getAll();

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unread_count);

          // Filter notifications by type and read status
          setUnreadNotifications(
            response.data.notifications.filter((n) => !n.is_read)
          );
          setDepositNotifications(
            response.data.notifications.filter(
              (n) => n.type === NotificationType.DEPOSIT
            )
          );
          setWithdrawalNotifications(
            response.data.notifications.filter(
              (n) => n.type === NotificationType.WITHDRAWAL
            )
          );
          setBonusNotifications(
            response.data.notifications.filter(
              (n) => n.type === NotificationType.BONUS
            )
          );
          setSystemNotifications(
            response.data.notifications.filter(
              (n) => n.type === NotificationType.SYSTEM
            )
          );
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load notifications"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (readingNotificationId === notificationId) return;

    setReadingNotificationId(notificationId);

    try {
      const response = await userApi.notifications.markAsRead(notificationId);

      if (response.error) {
        throw new Error(response.error);
      }

      // Update notifications in state
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      );
      setNotifications(updatedNotifications);

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update filtered lists
      const updatedUnread = unreadNotifications.filter(
        (n) => n.id !== notificationId
      );
      setUnreadNotifications(updatedUnread);

      setDepositNotifications(
        updatedNotifications.filter((n) => n.type === NotificationType.DEPOSIT)
      );
      setWithdrawalNotifications(
        updatedNotifications.filter(
          (n) => n.type === NotificationType.WITHDRAWAL
        )
      );
      setBonusNotifications(
        updatedNotifications.filter((n) => n.type === NotificationType.BONUS)
      );
      setSystemNotifications(
        updatedNotifications.filter((n) => n.type === NotificationType.SYSTEM)
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read"
      );
    } finally {
      setReadingNotificationId(null);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userApi.notifications.markAllAsRead();

      if (response.error) {
        throw new Error(response.error);
      }

      // Update all notifications in state
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        is_read: true,
      }));
      setNotifications(updatedNotifications);

      // Clear unread notifications
      setUnreadNotifications([]);
      setUnreadCount(0);

      // Update success message
      setSuccessMessage("All notifications marked as read");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Update filtered lists
      setDepositNotifications(
        updatedNotifications.filter((n) => n.type === NotificationType.DEPOSIT)
      );
      setWithdrawalNotifications(
        updatedNotifications.filter(
          (n) => n.type === NotificationType.WITHDRAWAL
        )
      );
      setBonusNotifications(
        updatedNotifications.filter((n) => n.type === NotificationType.BONUS)
      );
      setSystemNotifications(
        updatedNotifications.filter((n) => n.type === NotificationType.SYSTEM)
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DEPOSIT:
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case NotificationType.WITHDRAWAL:
        return <ArrowUpRight className="h-5 w-5 text-amber-500" />;
      case NotificationType.BONUS:
        return <Gift className="h-5 w-5 text-blue-500" />;
      case NotificationType.SYSTEM:
        return <Info className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Render notification items
  const renderNotificationItems = (notificationList: Notification[]) => {
    if (isLoading) {
      return [...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b last:border-0">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      ));
    }

    if (notificationList.length === 0) {
      return (
        <div className="text-center py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any notifications in this category.
          </p>
        </div>
      );
    }

    return notificationList.map((notification) => (
      <div
        key={notification.id}
        className={cn(
          "flex gap-4 p-4 border-b last:border-0 transition-colors",
          !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
        )}
      >
        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-muted">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "font-medium",
                  !notification.is_read && "font-semibold"
                )}
              >
                {notification.title}
              </h3>
              {!notification.is_read && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  New
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => markAsRead(notification.id)}
              disabled={
                notification.is_read ||
                readingNotificationId === notification.id
              }
            >
              {notification.is_read ? (
                <CheckCheck className="h-4 w-4 text-muted-foreground" />
              ) : readingNotificationId === notification.id ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
              ) : (
                <CircleCheck className="h-4 w-4" />
              )}
              <span className="sr-only">Mark as read</span>
            </Button>
          </div>

          <p className="text-sm mt-1">{notification.message}</p>

          <p className="text-xs text-muted-foreground mt-2">
            {formatDate(notification.created_at)}
          </p>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with activity on your account
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={isLoading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="all" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            <span>All</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Unread</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deposit">
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            <span>Deposits</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawal">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            <span>Withdrawals</span>
          </TabsTrigger>
          <TabsTrigger value="system">
            <Info className="h-4 w-4 mr-2" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Your account activity and system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="all" className="mt-0">
              {renderNotificationItems(notifications)}
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              {renderNotificationItems(unreadNotifications)}
            </TabsContent>

            <TabsContent value="deposit" className="mt-0">
              {renderNotificationItems(depositNotifications)}
            </TabsContent>

            <TabsContent value="withdrawal" className="mt-0">
              {renderNotificationItems(withdrawalNotifications)}
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              {renderNotificationItems(systemNotifications)}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
