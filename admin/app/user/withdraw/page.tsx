// app/user/withdraw/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/providers/auth-provider";
import { userApi } from "@/lib/user-api";
import { toast } from "sonner";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

// Withdrawal form schema
const withdrawalSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, { message: "Minimum withdrawal amount is 100 BDT" })
    .max(50000, { message: "Maximum withdrawal amount is 50,000 BDT" }),
  payment_method: z.enum(["bkash", "nagad", "rocket", "bank_transfer"]),
  account_number: z.string().min(5, { message: "Account number is required" }),
  account_name: z
    .string()
    .min(2, { message: "Account holder name is required" }),
  bank_name: z.string().optional(),
  branch_name: z.string().optional(),
});

export default function WithdrawPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [withdrawalInfo, setWithdrawalInfo] = useState({
    dailyLimit: 0,
    remainingLimit: 0,
    pendingWithdrawals: 0,
    completedTasks: 0,
    totalTasks: 0,
    isTodayLimitReached: false,
  });

  // Initialize form
  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 100,
      payment_method: "bkash",
      account_number: "",
      account_name: user?.name || "",
      bank_name: "",
      branch_name: "",
    },
  });

  // Watch payment method to conditionally show fields
  const paymentMethod = form.watch("payment_method");

  // Fetch withdrawal limits and status
  useEffect(() => {
    async function fetchWithdrawalInfo() {
      try {
        setIsLoading(true);

        // Fetch withdrawal limits
        const limitsResponse = await userApi.getWithdrawalLimits();

        // Fetch task completion status
        const tasksResponse = await userApi.getTasks();
        const tasks = tasksResponse.data.tasks || [];
        const completedTasks = tasks.filter(
          (task: any) => task.is_completed
        ).length;
        const totalTasks = tasks.length;

        // Check if user can withdraw
        const canWithdraw = completedTasks === totalTasks && totalTasks > 0;

        setWithdrawalInfo({
          dailyLimit: limitsResponse.data.daily_limit || 0,
          remainingLimit: limitsResponse.data.remaining_limit || 0,
          pendingWithdrawals: limitsResponse.data.pending_withdrawals || 0,
          completedTasks,
          totalTasks,
          isTodayLimitReached: limitsResponse.data.remaining_limit <= 0,
        });

        setCanWithdraw(canWithdraw);

        // If user can't withdraw, redirect to tasks page
        if (!canWithdraw) {
          toast.warning("You need to complete all tasks before withdrawing");
        }
      } catch (error) {
        console.error("Error fetching withdrawal info:", error);
        toast.error("Failed to load withdrawal information");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWithdrawalInfo();
  }, [router]);

  // Handle withdrawal submission
  const onSubmit = async (data: z.infer<typeof withdrawalSchema>) => {
    // Check if user can withdraw
    if (!canWithdraw) {
      toast.error("You need to complete all tasks before withdrawing");
      router.push("/user/tasks");
      return;
    }

    // Check if user has enough balance
    if ((user?.balance || 0) < data.amount) {
      toast.error("Insufficient balance");
      return;
    }

    // Check if withdrawal amount is within daily limit
    if (data.amount > withdrawalInfo.remainingLimit) {
      toast.error(
        `Amount exceeds your remaining daily limit of ${withdrawalInfo.remainingLimit} BDT`
      );
      return;
    }

    setIsLoading(true);
    try {
      // Create payment details
      const paymentDetails: Record<string, string> = {
        account_number: data.account_number,
        account_name: data.account_name,
      };

      // Add bank details if payment method is bank transfer
      if (data.payment_method === "bank_transfer" && data.bank_name) {
        paymentDetails.bank_name = data.bank_name;
        paymentDetails.branch_name = data.branch_name || "";
      }

      // Submit withdrawal request
      await userApi.requestWithdrawal({
        amount: data.amount,
        payment_method: data.payment_method,
        payment_details: paymentDetails,
      });

      // Show success message
      setWithdrawalSuccess(true);

      // Reset form
      form.reset();

      // Update user's balance (optimistic update)
      if (user) {
        user.balance -= data.amount;
      }
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast.error("Failed to process withdrawal request");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get payment method display name
  const getPaymentMethodName = (method: string): string => {
    switch (method) {
      case "bkash":
        return "bKash";
      case "nagad":
        return "Nagad";
      case "rocket":
        return "Rocket";
      case "bank_transfer":
        return "Bank Transfer";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Withdraw Funds</h1>

      {/* Success message */}
      {withdrawalSuccess && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Withdrawal Request Submitted</AlertTitle>
          <AlertDescription>
            Your withdrawal request has been submitted successfully. It will be
            processed within 24-48 hours.
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-green-600 dark:text-green-400"
              onClick={() => router.push("/user/transactions")}
            >
              View transaction history
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Task completion check */}
      {!canWithdraw && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tasks Not Completed</AlertTitle>
          <AlertDescription>
            You need to complete all tasks before you can withdraw funds.
            <div className="mt-2">
              <Progress
                value={
                  (withdrawalInfo.completedTasks / withdrawalInfo.totalTasks) *
                  100
                }
                className="h-2"
              />
              <p className="text-sm mt-1">
                {withdrawalInfo.completedTasks} of {withdrawalInfo.totalTasks}{" "}
                tasks completed
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/user/tasks")}
            >
              Complete Tasks
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Daily limit check */}
      {canWithdraw && withdrawalInfo.isTodayLimitReached && (
        <Alert
          variant="default"
          className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Daily Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached your daily withdrawal limit of{" "}
            {withdrawalInfo.dailyLimit} BDT. Please try again tomorrow.
          </AlertDescription>
        </Alert>
      )}

      {/* Withdrawal form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>
            Request a withdrawal to your mobile banking or bank account
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 rounded-md bg-muted/50 border">
              <div>
                <p className="font-medium">Available Balance</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(user?.balance || 0)}
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <p className="font-medium">Daily Withdrawal Limit</p>
                <p className="text-lg">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "BDT",
                    }).format(withdrawalInfo.remainingLimit)}
                  </span>{" "}
                  remaining of{" "}
                  <span className="font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "BDT",
                    }).format(withdrawalInfo.dailyLimit)}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                {...form.register("amount")}
                disabled={!canWithdraw || withdrawalInfo.isTodayLimitReached}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Select Payment Method</Label>
              <RadioGroup
                defaultValue="bkash"
                onValueChange={(value) =>
                  form.setValue("payment_method", value as any)
                }
                className="grid grid-cols-2 gap-4"
                disabled={!canWithdraw || withdrawalInfo.isTodayLimitReached}
              >
                <div>
                  <RadioGroupItem
                    value="bkash"
                    id="withdraw_bkash"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="withdraw_bkash"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <img
                      src="/images/bkash-logo.png"
                      alt="bKash"
                      className="h-10 mb-2"
                    />
                    bKash
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="nagad"
                    id="withdraw_nagad"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="withdraw_nagad"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <img
                      src="/images/nagad-logo.png"
                      alt="Nagad"
                      className="h-10 mb-2"
                    />
                    Nagad
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="rocket"
                    id="withdraw_rocket"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="withdraw_rocket"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <img
                      src="/images/rocket-logo.png"
                      alt="Rocket"
                      className="h-10 mb-2"
                    />
                    Rocket
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="bank_transfer"
                    id="withdraw_bank_transfer"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="withdraw_bank_transfer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <img
                      src="/images/bank-logo.png"
                      alt="Bank Transfer"
                      className="h-10 mb-2"
                    />
                    Bank Transfer
                  </Label>
                </div>
              </RadioGroup>
              {form.formState.errors.payment_method && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.payment_method.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">
                {paymentMethod === "bank_transfer"
                  ? "Account Number"
                  : "Mobile Number"}
              </Label>
              <Input
                id="account_number"
                placeholder={
                  paymentMethod === "bank_transfer"
                    ? "Enter account number"
                    : "Enter mobile number"
                }
                {...form.register("account_number")}
                disabled={!canWithdraw || withdrawalInfo.isTodayLimitReached}
              />
              {form.formState.errors.account_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.account_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">
                {paymentMethod === "bank_transfer"
                  ? "Account Holder Name"
                  : "Mobile Account Name"}
              </Label>
              <Input
                id="account_name"
                placeholder="Enter account holder name"
                {...form.register("account_name")}
                disabled={!canWithdraw || withdrawalInfo.isTodayLimitReached}
              />
              {form.formState.errors.account_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.account_name.message}
                </p>
              )}
            </div>

            {paymentMethod === "bank_transfer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Select
                    onValueChange={(value) => form.setValue("bank_name", value)}
                    defaultValue=""
                    disabled={
                      !canWithdraw || withdrawalInfo.isTodayLimitReached
                    }
                  >
                    <SelectTrigger id="bank_name">
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_asia">Bank Asia</SelectItem>
                      <SelectItem value="brac_bank">BRAC Bank</SelectItem>
                      <SelectItem value="city_bank">City Bank</SelectItem>
                      <SelectItem value="dutch_bangla">
                        Dutch-Bangla Bank
                      </SelectItem>
                      <SelectItem value="eastern_bank">Eastern Bank</SelectItem>
                      <SelectItem value="islami_bank">Islami Bank</SelectItem>
                      <SelectItem value="jamuna_bank">Jamuna Bank</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch_name">Branch Name</Label>
                  <Input
                    id="branch_name"
                    placeholder="Enter branch name"
                    {...form.register("branch_name")}
                    disabled={
                      !canWithdraw || withdrawalInfo.isTodayLimitReached
                    }
                  />
                </div>
              </>
            )}

            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>Processing Time</AlertTitle>
              <AlertDescription>
                Withdrawal requests are typically processed within 24-48 hours.
                You will receive a notification once your withdrawal is
                approved.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                !canWithdraw ||
                withdrawalInfo.isTodayLimitReached ||
                (user?.balance || 0) < (form.getValues().amount || 0)
              }
            >
              {isLoading ? "Processing..." : "Submit Withdrawal Request"}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>

      {withdrawalInfo.pendingWithdrawals > 0 && (
        <Alert className="bg-muted border">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Withdrawals</AlertTitle>
          <AlertDescription>
            You have {withdrawalInfo.pendingWithdrawals} pending withdrawal
            {withdrawalInfo.pendingWithdrawals > 1 ? "s" : ""}.
            <Button
              variant="link"
              className="p-0 h-auto ml-1"
              onClick={() => router.push("/user/transactions")}
            >
              View details
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
