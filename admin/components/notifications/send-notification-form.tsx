// src/components/notifications/send-notification-form.tsx
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

// Form schema
const notificationFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title cannot exceed 50 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message cannot exceed 500 characters"),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

interface SendNotificationFormProps {
  onSubmit: (data: NotificationFormValues) => Promise<void>;
  isLoading: boolean;
}

export function SendNotificationForm({
  onSubmit,
  isLoading,
}: SendNotificationFormProps) {
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  const handleSubmit = async (values: NotificationFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Title</FormLabel>
              <FormControl>
                <Input
                  id="title-input"
                  placeholder="Enter notification title"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This will appear as the notification heading
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Message</FormLabel>
              <FormControl>
                <Textarea
                  id="message-input"
                  placeholder="Enter notification message"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The main content of your notification
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Notification to All Users"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
