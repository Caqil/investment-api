// src/components/notifications/notification-preview.tsx
import React from "react";
import { Bell } from "lucide-react";
import { cn } from "../../lib/utils";

interface NotificationPreviewProps {
  title: string;
  message: string;
  className?: string;
}

export function NotificationPreview({
  title,
  message,
  className,
}: NotificationPreviewProps) {
  return (
    <div
      className={cn(
        "border rounded-md p-4 bg-card shadow-sm max-w-md",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Bell className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-sm">
            {title || "Notification Title"}
          </h4>
          <p className="text-muted-foreground text-sm mt-1">
            {message || "Your notification message will appear here."}
          </p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-muted-foreground">Just now</span>
            <span className="text-xs text-primary font-medium">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
