// src/components/plans/plan-form-dialog.tsx
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
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
import { Switch } from "../ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plan } from "../../types/plan";

// Form schema
const planFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  daily_deposit_limit: z.number().min(0, "Must be a non-negative value"),
  daily_withdrawal_limit: z.number().min(0, "Must be a non-negative value"),
  daily_profit_limit: z.number().min(0, "Must be a non-negative value"),
  price: z.number().min(0, "Must be a non-negative value"),
  is_default: z.boolean().default(false),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormDialogProps {
  plan?: Plan;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: PlanFormValues) => Promise<void>;
  trigger?: React.ReactNode;
}

export function PlanFormDialog({
  plan,
  open,
  onOpenChange,
  onSubmit,
  trigger,
}: PlanFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Controlled or uncontrolled
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isDialogOpen = isControlled ? open : isOpen;
  const setIsDialogOpen = isControlled ? onOpenChange : setIsOpen;

  // Initialize form
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          daily_deposit_limit: plan.daily_deposit_limit,
          daily_withdrawal_limit: plan.daily_withdrawal_limit,
          daily_profit_limit: plan.daily_profit_limit,
          price: plan.price,
          is_default: plan.is_default,
        }
      : {
          name: "",
          daily_deposit_limit: 10000,
          daily_withdrawal_limit: 5000,
          daily_profit_limit: 1000,
          price: 0,
          is_default: false,
        },
  });

  // Form submission handler
  const handleSubmit = async (values: PlanFormValues) => {
    setIsLoading(true);

    try {
      await onSubmit(values);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting plan form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "Update the details for this subscription plan."
              : "Add a new subscription plan for users."}
          </DialogDescription>
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
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basic, Silver, Gold" {...field} />
                  </FormControl>
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
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>Set to 0 for free plans</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="daily_deposit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Deposit Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_withdrawal_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Withdrawal Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_profit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Profit Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Default Plan</FormLabel>
                    <FormDescription>
                      Make this the default plan for new users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? plan
                    ? "Updating..."
                    : "Creating..."
                  : plan
                  ? "Update Plan"
                  : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
