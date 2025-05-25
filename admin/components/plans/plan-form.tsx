// components/plans/plan-form-dialog.tsx
"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plan } from "@/types/plan";

// Define the form schema
const planFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  daily_deposit_limit: z.coerce.number().min(0, "Must be a positive number"),
  daily_withdrawal_limit: z.coerce.number().min(0, "Must be a positive number"),
  daily_profit_limit: z.coerce.number().min(0, "Must be a positive number"),
  price: z.coerce.number().min(0, "Must be a positive number"),
  is_default: z.boolean().default(false),
});

// Define the form values type using the schema
type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanFormValues) => Promise<void> | void;
  initialData?: Plan; // For editing existing plan
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title = "Create Plan",
  description = "Add a new subscription plan for users.",
  submitLabel = "Create",
}: PlanFormDialogProps) {
  // Initialize form with schema resolver and default values
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      daily_deposit_limit: initialData?.daily_deposit_limit || 0,
      daily_withdrawal_limit: initialData?.daily_withdrawal_limit || 0,
      daily_profit_limit: initialData?.daily_profit_limit || 0,
      price: initialData?.price || 0,
      is_default: initialData?.is_default || false,
    },
  });

  // Handle form submission
  const handleSubmit = async (values: PlanFormValues) => {
    try {
      await onSubmit(values);
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Error submitting form:", error);
      // You could add error handling here
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Premium Plan" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the subscription plan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_deposit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Deposit Limit (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount a user can deposit per day.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_withdrawal_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Withdrawal Limit (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="5000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount a user can withdraw per day.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_profit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Profit Limit (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum profit a user can earn per day.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The cost of the subscription plan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as Default Plan</FormLabel>
                    <FormDescription>
                      New users will be assigned this plan by default
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{submitLabel}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
