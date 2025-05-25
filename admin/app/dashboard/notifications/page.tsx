"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { notificationsApi } from "../../../lib/api";
import { Card } from "../../../components/ui/card";
import { SendNotificationForm } from "../../../components/notifications/send-notification-form";

export default function NotificationsPage() {
  const [isSending, setIsSending] = useState(false);
 // const { toast } = useToast();

  const handleSendNotification = async (data: {
    title: string;
    message: string;
  }) => {
    try {
      setIsSending(true);
      await notificationsApi.send(data);

    //   toast({
    //     title: "Success",
    //     description: "Notification sent to all users",
    //   });
    } catch (error) {
      console.error("Error sending notification:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to send notification",
    //     variant: "destructive",
    //   });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">Send notifications to app users</p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="send">Send Notification</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4">
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium mb-2">
                Send Mass Notification
              </h3>
              <p className="text-muted-foreground mb-4">
                This notification will be sent to all active users of the
                platform. Use this for important announcements, updates, or
                promotions.
              </p>

              <SendNotificationForm
                onSubmit={handleSendNotification}
                isLoading={isSending}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Templates</h3>
              <p className="text-muted-foreground">
                Click on a template to use it for your notification.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  className="block p-4 border rounded-md hover:border-primary text-left transition-colors"
                  onClick={() => {
                    document
                      .getElementById("title-input")
                      ?.setAttribute("value", "New Feature Announcement");
                    const messageInput = document.getElementById(
                      "message-input"
                    ) as HTMLTextAreaElement;
                    if (messageInput) {
                      messageInput.value =
                        "We're excited to announce a new feature on our platform! Check it out now.";
                    }
                  }}
                >
                  <h4 className="font-medium">New Feature Announcement</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Announce a new feature or update to users
                  </p>
                </button>

                <button
                  className="block p-4 border rounded-md hover:border-primary text-left transition-colors"
                  onClick={() => {
                    document
                      .getElementById("title-input")
                      ?.setAttribute("value", "Special Promotion");
                    const messageInput = document.getElementById(
                      "message-input"
                    ) as HTMLTextAreaElement;
                    if (messageInput) {
                      messageInput.value =
                        "Limited time offer! Take advantage of our special promotion today.";
                    }
                  }}
                >
                  <h4 className="font-medium">Special Promotion</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Promote a special offer or discount
                  </p>
                </button>

                <button
                  className="block p-4 border rounded-md hover:border-primary text-left transition-colors"
                  onClick={() => {
                    document
                      .getElementById("title-input")
                      ?.setAttribute("value", "Maintenance Notice");
                    const messageInput = document.getElementById(
                      "message-input"
                    ) as HTMLTextAreaElement;
                    if (messageInput) {
                      messageInput.value =
                        "We'll be performing maintenance on our servers. The platform may be temporarily unavailable.";
                    }
                  }}
                >
                  <h4 className="font-medium">Maintenance Notice</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inform users about upcoming maintenance
                  </p>
                </button>

                <button
                  className="block p-4 border rounded-md hover:border-primary text-left transition-colors"
                  onClick={() => {
                    document
                      .getElementById("title-input")
                      ?.setAttribute("value", "Important Update");
                    const messageInput = document.getElementById(
                      "message-input"
                    ) as HTMLTextAreaElement;
                    if (messageInput) {
                      messageInput.value =
                        "Important update regarding your account. Please check your dashboard for more information.";
                    }
                  }}
                >
                  <h4 className="font-medium">Important Update</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify users about important updates
                  </p>
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Notification Best Practices</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>Keep notifications concise and to the point</li>
          <li>Use a clear, actionable title that summarizes the message</li>
          <li>Avoid sending too many notifications in a short period</li>
          <li>Make sure the notification adds value for the user</li>
          <li>Include a call to action when appropriate</li>
          <li>Test your notification before sending to all users</li>
        </ul>
      </div>
    </div>
  );
}
