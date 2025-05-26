"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import { Withdrawal, WithdrawalStatus } from "@/types/withdrawal";
import {
  ArrowUpRight,
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { User } from "@/types/auth";
import { Task } from "@/types/task";

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Withdrawal request form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if mandatory tasks are completed
  const [mandatoryTasksCompleted, setMandatoryTasksCompleted] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);

  // Fetch withdrawals and profile data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch withdrawals
        const withdrawalsResponse = await userApi.withdrawals.getAll();
        if (withdrawalsResponse.error) {
          throw new Error(withdrawalsResponse.error);
        }

        if (withdrawalsResponse.data) {
          setWithdrawals(withdrawalsResponse.data.withdrawals);
        }

        // Fetch profile data
        const profileResponse = await userApi.profile.getProfile();
        if (profileResponse.error) {
          throw new Error(profileResponse.error);
        }

        if (profileResponse.data) {
          setUser(profileResponse.data.user);
        }

        // Fetch KYC status
        const kycResponse = await userApi.kyc.getStatus();
        if (kycResponse.data) {
          setIsKycVerified(
            kycResponse.data.kyc_submitted &&
              kycResponse.data.kyc?.status === "approved"
          );
        }

        // Fetch tasks
        const tasksResponse = await userApi.tasks.getAll();
        if (tasksResponse.error) {
          throw new Error(tasksResponse.error);
        }

        if (tasksResponse.data) {
          setTasks(tasksResponse.data.tasks);

          // Check if all mandatory tasks are completed
          const mandatoryTasks = tasksResponse.data.tasks.filter(
            (task) => task.is_mandatory
          );
          const allCompleted =
            mandatoryTasks.length > 0 &&
            mandatoryTasks.every((task) => task.is_completed);
          setMandatoryTasksCompleted(allCompleted);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle withdrawal request
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const amount = parseFloat(withdrawalAmount);

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!paymentMethod) {
        throw new Error("Please select a payment method");
      }

      if (!accountNumber) {
        throw new Error("Please enter your account number");
      }

      // Prepare payment details based on method
      const paymentDetails: Record<string, any> = {
        account_number: accountNumber,
        account_name: accountName,
      };

      const response = await userApi.withdrawals.request({
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccessMessage("Withdrawal request submitted successfully");

      // Reset form
      setWithdrawalAmount("");
      setPaymentMethod("bkash");
      setAccountNumber("");
      setAccountName("");

      // Close dialog after a delay
      setTimeout(() => {
        setIsDialogOpen(false);

        // Add the new withdrawal to the list
        if (response.data?.withdrawal) {
          setWithdrawals((prev) => [response.data!.withdrawal, ...prev]);
        }

        // Clear success message after dialog closes
        setTimeout(() => {
          setSuccessMessage(null);
        }, 500);
      }, 2000);
    } catch (err) {
      console.error("Error submitting withdrawal request:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit withdrawal request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case WithdrawalStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case WithdrawalStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Withdrawals</h2>
          <p className="text-muted-foreground">
            Request and track your withdrawal transactions
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="self-start"
              disabled={!mandatoryTasksCompleted || !isKycVerified || isLoading}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Enter the amount you want to withdraw and your payment details
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive" className="my-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30 my-2">
                <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleWithdrawalRequest} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (BDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="100"
                  step="0.01"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available balance: {formatCurrency(user?.balance || 0, "BDT")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name (Optional)</Label>
                <Input
                  id="accountName"
                  placeholder="Enter account name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {(!mandatoryTasksCompleted || !isKycVerified) && (
        <Alert
          variant="warning"
          className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        >
          <AlertCircle className="h-4 w-4 text-amber-800 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-400">
            {!mandatoryTasksCompleted && !isKycVerified
              ? "You need to complete all required tasks and verify your KYC to request withdrawals."
              : !mandatoryTasksCompleted
              ? "You need to complete all required tasks to request withdrawals."
              : "You need to verify your KYC to request withdrawals."}{" "}
            {!mandatoryTasksCompleted && (
              <Button
                variant="link"
                className="p-0 h-auto text-amber-800 dark:text-amber-400 underline"
                onClick={() => (window.location.href = "/user/tasks")}
              >
                Go to Tasks
              </Button>
            )}
            {!isKycVerified && (
              <Button
                variant="link"
                className="p-0 h-auto text-amber-800 dark:text-amber-400 underline"
                onClick={() => (window.location.href = "/user/kyc")}
              >
                Verify KYC
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            Track the status of your withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ArrowUpRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No withdrawals yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You haven't made any withdrawal requests yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">
                        #{withdrawal.id}
                      </TableCell>
                      <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                      <TableCell>
                        {formatCurrency(withdrawal.amount, "BDT")}
                      </TableCell>
                      <TableCell>{withdrawal.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {withdrawal.admin_note || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground border-t p-4">
          <div className="space-y-4 w-full">
            <p>Withdrawal notes:</p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>Minimum withdrawal amount: 100 BDT</li>
              <li>Withdrawals are typically processed within 24-48 hours</li>
              <li>You must complete all required tasks and KYC verification</li>
              <li>
                There may be a transaction fee depending on the payment method
              </li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
