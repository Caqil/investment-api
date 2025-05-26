// investment-admin/components/notifications/send-notification-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Loader2 } from "lucide-react";

interface SendNotificationFormProps {
  onSend: (data: {
    user_id?: number;
    title: string;
    message: string;
  }) => Promise<boolean>;
}

export function SendNotificationForm({ onSend }: SendNotificationFormProps) {
  const [userId, setUserId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !message) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Define the data object with the correct type that includes an optional user_id
      const data: {
        title: string;
        message: string;
        user_id?: number;
      } = {
        title,
        message,
      };

      // Now TypeScript knows user_id is a valid property that might be added
      if (userId) {
        data.user_id = parseInt(userId);
      }

      const result = await onSend(data);
      if (result) {
        setSuccess(true);
        // Reset form
        if (!userId) {
          // Only reset if sending to all users
          setTitle("");
          setMessage("");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send notification"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notification</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-300">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription>
                Notification sent successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="userId">User ID (optional)</Label>
            <Input
              id="userId"
              type="number"
              placeholder="Leave empty to send to all users"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Leave empty to send notification to all users
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              Title
            </Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Notification message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
