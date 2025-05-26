// investment-admin/app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type {
  Notification,
  NotificationType,
  NotificationStats as NotificationStatsType,
} from "@/types/notification";
import { AlertCircle, RefreshCw, Search, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationStats } from "@/components/notifications/notification-stats";
import { NotificationTable } from "@/components/notifications/notification-table";
import { NotificationDetails } from "@/components/notifications/notification-details";
import { SendNotificationForm } from "@/components/notifications/send-notification-form";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationTypeFilter, setNotificationTypeFilter] =
    useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [stats, setStats] = useState<NotificationStatsType | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare API call options based on tab
      const options: {
        limit: number;
        is_read?: boolean;
      } = {
        limit: 100, // You might want to implement pagination
      };

      if (activeTab === "unread") {
        options.is_read = false;
      } else if (activeTab === "read") {
        options.is_read = true;
      }

      // Get notifications based on selected tab
      const response = await api.notifications.getAll(options);

      if (response.error) {
        throw new Error(response.error);
      }

      setNotifications(response.data?.notifications || []);

      // Fetch notification stats
      const statsResponse = await api.notifications.getStats();
      if (!statsResponse.error && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, refreshTrigger]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...notifications];

    // Apply notification type filter
    if (notificationTypeFilter !== "all") {
      result = result.filter(
        (notification) =>
          notification.type === (notificationTypeFilter as NotificationType)
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (notification) =>
          notification.id.toString().includes(query) ||
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.user_id.toString().includes(query)
      );
    }

    setFilteredNotifications(result);
  }, [notifications, notificationTypeFilter, searchQuery]);

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await api.notifications.markAsRead(id);
      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // If we're viewing a notification, update it too
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification({ ...selectedNotification, is_read: true });
      }

      // Refresh stats
      const statsResponse = await api.notifications.getStats();
      if (!statsResponse.error && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read"
      );
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      const response = await api.notifications.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );

      // If we're viewing the deleted notification, go back
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(null);
      }

      // Refresh stats
      const statsResponse = await api.notifications.getStats();
      if (!statsResponse.error && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete notification"
      );
    }
  };

  const handleSendNotification = async (data: {
    user_id?: number;
    title: string;
    message: string;
  }): Promise<boolean> => {
    try {
      const response = await api.notifications.send(data);
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh the notifications list
      setRefreshTrigger((prev) => prev + 1);

      return true;
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send notification"
      );
      return false;
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Notification Management
        </h1>
        <div className="space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowSendDialog(true)} size="sm">
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notification Statistics */}
      <NotificationStats stats={stats} loading={loading} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by title, message, user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>
        <Select
          value={notificationTypeFilter}
          onValueChange={setNotificationTypeFilter}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Notification Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="bonus">Bonus</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for filtering by read status */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {selectedNotification ? (
            <NotificationDetails
              notification={selectedNotification}
              onBack={() => setSelectedNotification(null)}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ) : (
            <NotificationTable
              notifications={filteredNotifications}
              loading={loading}
              onView={handleViewNotification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          {selectedNotification ? (
            <NotificationDetails
              notification={selectedNotification}
              onBack={() => setSelectedNotification(null)}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ) : (
            <NotificationTable
              notifications={filteredNotifications}
              loading={loading}
              onView={handleViewNotification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-4">
          {selectedNotification ? (
            <NotificationDetails
              notification={selectedNotification}
              onBack={() => setSelectedNotification(null)}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ) : (
            <NotificationTable
              notifications={filteredNotifications}
              loading={loading}
              onView={handleViewNotification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          )}
        </TabsContent>
      </Tabs>

      {filteredNotifications.length === 0 &&
        !loading &&
        !selectedNotification && (
          <Card>
            <CardHeader>
              <CardTitle>No notifications found</CardTitle>
              <CardDescription>
                {searchQuery || notificationTypeFilter !== "all"
                  ? "Try adjusting your filters"
                  : `There are no ${
                      activeTab === "unread"
                        ? "unread"
                        : activeTab === "read"
                        ? "read"
                        : ""
                    } notifications to display`}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

      {/* Send Notification Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <SendNotificationForm onSend={handleSendNotification} />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
