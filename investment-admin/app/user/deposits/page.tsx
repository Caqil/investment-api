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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/types/transaction";
import {
  ArrowDownLeft,
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Bitcoin,
  FileText,
  Upload,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DepositsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositTransactions, setDepositTransactions] = useState<Transaction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Payment methods
  const [activeTab, setActiveTab] = useState("manual");
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual deposit form
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [senderName, setSenderName] = useState("");

  // Payment gateway states
  const [coingateAmount, setCoingateAmount] = useState("");
  const [uddoktaPayAmount, setUddoktaPayAmount] = useState("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Sample payment methods info
  const paymentMethodsInfo = {
    bkash: {
      name: "bKash",
      number: "01712345678",
      type: "Personal",
    },
    rocket: {
      name: "Rocket",
      number: "01712345678",
      type: "Personal",
    },
    nagad: {
      name: "Nagad",
      number: "01712345678",
      type: "Personal",
    },
  };

  // Fetch deposit transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await userApi.transactions.getAll();

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setTransactions(response.data.transactions);

          // Filter for deposit transactions
          const deposits = response.data.transactions.filter(
            (t) => t.type === TransactionType.DEPOSIT
          );
          setDepositTransactions(deposits);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load transactions"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Handle manual deposit submission
  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const amountValue = parseFloat(amount);

      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!transactionId) {
        throw new Error("Please enter the transaction ID");
      }

      if (!senderNumber) {
        throw new Error("Please enter the sender number");
      }

      const response = await userApi.deposits.viaManual({
        amount: amountValue,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        sender_information: {
          sender_number: senderNumber,
          sender_name: senderName,
        },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccessMessage("Manual deposit request submitted successfully");

      // Reset form
      setAmount("");
      setTransactionId("");
      setSenderNumber("");
      setSenderName("");

      // Close dialog after a delay
      setTimeout(() => {
        setIsManualDialogOpen(false);

        // Clear success message after dialog closes
        setTimeout(() => {
          setSuccessMessage(null);
        }, 500);
      }, 2000);
    } catch (err) {
      console.error("Error submitting manual deposit:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit deposit request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CoinGate payment
  const handleCoingatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setPaymentUrl(null);

    try {
      const amountValue = parseFloat(coingateAmount);

      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const response = await userApi.deposits.viaCoingate({
        amount: amountValue,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.payment_url) {
        setPaymentUrl(response.data.payment_url);
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      console.error("Error initiating CoinGate payment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle UddoktaPay payment
  const handleUddoktaPayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setPaymentUrl(null);

    try {
      const amountValue = parseFloat(uddoktaPayAmount);

      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const response = await userApi.deposits.viaUddoktaPay({
        amount: amountValue,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.payment_url) {
        setPaymentUrl(response.data.payment_url);
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err) {
      console.error("Error initiating UddoktaPay payment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy payment details to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Copied to clipboard");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  // Get status badge
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case TransactionStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case TransactionStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Deposits</h2>
        <p className="text-muted-foreground">
          Add funds to your account using various payment methods
        </p>
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

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="manual">
            <Wallet className="h-4 w-4 mr-2" />
            Mobile Banking
          </TabsTrigger>
          <TabsTrigger value="coingate">
            <Bitcoin className="h-4 w-4 mr-2" />
            Crypto
          </TabsTrigger>
          <TabsTrigger value="uddoktapay">
            <CreditCard className="h-4 w-4 mr-2" />
            UddoktaPay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Deposit via Mobile Banking</CardTitle>
              <CardDescription>
                Send money to our account and submit the transaction details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(paymentMethodsInfo).map(([key, info]) => (
                  <Card key={key} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{info.name}</CardTitle>
                      <CardDescription>{info.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {info.number}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(info.number)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy number</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center">
                <Dialog
                  open={isManualDialogOpen}
                  onOpenChange={setIsManualDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto">
                      <ArrowDownLeft className="mr-2 h-4 w-4" />
                      Submit Deposit Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manual Deposit</DialogTitle>
                      <DialogDescription>
                        Enter the details of your payment
                      </DialogDescription>
                    </DialogHeader>

                    <form
                      onSubmit={handleManualDeposit}
                      className="space-y-4 py-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (BDT)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min="100"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <select
                          id="paymentMethod"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          required
                        >
                          <option value="bkash">bKash</option>
                          <option value="rocket">Rocket</option>
                          <option value="nagad">Nagad</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transactionId">Transaction ID</Label>
                        <Input
                          id="transactionId"
                          placeholder="Enter transaction ID"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="senderNumber">Sender Number</Label>
                        <Input
                          id="senderNumber"
                          placeholder="Enter sender mobile number"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="senderName">
                          Sender Name (Optional)
                        </Label>
                        <Input
                          id="senderName"
                          placeholder="Enter sender name"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                        />
                      </div>

                      <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Submit Deposit"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coingate">
          <Card>
            <CardHeader>
              <CardTitle>Deposit via CoinGate</CardTitle>
              <CardDescription>
                Deposit using Bitcoin, Ethereum, and other cryptocurrencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentUrl ? (
                <div className="space-y-4">
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Payment initialized! Click the button below to complete
                      your payment.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => window.open(paymentUrl, "_blank")}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Complete Payment
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      You will be redirected to CoinGate to complete your
                      payment.
                    </p>
                    <p>
                      Your account will be credited after the payment is
                      confirmed.
                    </p>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPaymentUrl(null)}
                    >
                      Cancel and Start Over
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleCoingatePayment}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <div className="space-y-2">
                    <Label htmlFor="coingateAmount">Amount (USD)</Label>
                    <Input
                      id="coingateAmount"
                      type="number"
                      placeholder="Enter amount in USD"
                      value={coingateAmount}
                      onChange={(e) => setCoingateAmount(e.target.value)}
                      min="5"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum deposit: 5 USD. Approximate exchange rate: 1 USD ≈
                      120 BDT
                    </p>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Bitcoin className="mr-2 h-4 w-4" />
                          Pay with Crypto
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground border-t p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bitcoin className="h-4 w-4" />
                <span>Powered by CoinGate</span>
              </div>
              <p>
                Secure and instant crypto payments with support for Bitcoin,
                Ethereum, Litecoin, and more.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="uddoktapay">
          <Card>
            <CardHeader>
              <CardTitle>Deposit via UddoktaPay</CardTitle>
              <CardDescription>
                Deposit using local Bangladeshi payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentUrl ? (
                <div className="space-y-4">
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Payment initialized! Click the button below to complete
                      your payment.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => window.open(paymentUrl, "_blank")}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Complete Payment
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>
                      You will be redirected to UddoktaPay to complete your
                      payment.
                    </p>
                    <p>
                      Your account will be credited after the payment is
                      confirmed.
                    </p>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPaymentUrl(null)}
                    >
                      Cancel and Start Over
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleUddoktaPayPayment}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <div className="space-y-2">
                    <Label htmlFor="uddoktaPayAmount">Amount (BDT)</Label>
                    <Input
                      id="uddoktaPayAmount"
                      type="number"
                      placeholder="Enter amount in BDT"
                      value={uddoktaPayAmount}
                      onChange={(e) => setUddoktaPayAmount(e.target.value)}
                      min="100"
                      step="1"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum deposit: 100 BDT
                    </p>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay with UddoktaPay
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground border-t p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4" />
                <span>Powered by UddoktaPay</span>
              </div>
              <p>
                Secure payments with bKash, Nagad, Rocket, bank transfers, and
                other local payment methods.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
          <CardDescription>
            Track the status of your deposit transactions
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
          ) : depositTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ArrowDownLeft className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No deposits yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You haven't made any deposits yet.
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
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depositTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        #{transaction.id}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        +{formatCurrency(transaction.amount, "BDT")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.description || "Deposit"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
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
            <p>Deposit notes:</p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>Minimum deposit amount: 100 BDT</li>
              <li>
                Manual deposits are typically processed within 1-2 hours during
                working hours
              </li>
              <li>
                Please ensure to provide the correct transaction ID and sender
                information
              </li>
              <li>
                For any issues with deposits, please contact customer support
              </li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
