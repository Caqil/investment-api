// app/user/deposit/page.tsx
"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/providers/auth-provider";
import { userApi } from "@/lib/user-api";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  Upload,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

// Deposit form schema
const depositSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, { message: "Minimum deposit amount is 100 BDT" })
    .max(50000, { message: "Maximum deposit amount is 50,000 BDT" }),
});

// Manual deposit form schema
const manualDepositSchema = z.object({
  amount: z.coerce
    .number()
    .min(100, { message: "Minimum deposit amount is 100 BDT" })
    .max(50000, { message: "Maximum deposit amount is 50,000 BDT" }),
  transaction_id: z.string().min(5, { message: "Transaction ID is required" }),
  payment_method: z.enum(["bkash", "nagad", "rocket", "bank_transfer"]),
  sender_name: z.string().min(2, { message: "Sender name is required" }),
  sender_number: z
    .string()
    .min(10, { message: "Valid sender number is required" }),
});

export default function DepositPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<{
    method: string;
    amount: number;
    redirectUrl?: string;
  } | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Gateway deposit form
  const gatewayForm = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 100,
    },
  });

  // Manual deposit form
  const manualForm = useForm<z.infer<typeof manualDepositSchema>>({
    resolver: zodResolver(manualDepositSchema),
    defaultValues: {
      amount: 100,
      transaction_id: "",
      payment_method: "bkash",
      sender_name: "",
      sender_number: "",
    },
  });

  // Handle gateway deposit
  const onGatewaySubmit = async (
    data: z.infer<typeof depositSchema>,
    gateway: string
  ) => {
    setIsLoading(true);
    try {
      const response = await userApi.depositViaGateway(gateway, data.amount);

      // Handle response based on gateway
      if (gateway === "coingate") {
        // Redirect to payment URL
        setDepositSuccess({
          method: "CoinGate",
          amount: data.amount,
          redirectUrl: response.data.payment_url,
        });
      } else if (gateway === "uddoktapay") {
        // Redirect to payment URL
        setDepositSuccess({
          method: "UddoktaPay",
          amount: data.amount,
          redirectUrl: response.data.payment_url,
        });
      }

      // Reset form
      gatewayForm.reset();
    } catch (error) {
      console.error(`Error depositing via ${gateway}:`, error);
      toast.error(`Failed to process ${gateway} deposit`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual deposit
  const onManualSubmit = async (data: z.infer<typeof manualDepositSchema>) => {
    setIsLoading(true);
    try {
      // Create sender information object
      const senderInformation = {
        name: data.sender_name,
        number: data.sender_number,
      };

      const response = await userApi.depositViaManual({
        amount: data.amount,
        transaction_id: data.transaction_id,
        payment_method: data.payment_method,
        sender_information: senderInformation,
      });

      setDepositSuccess({
        method: getPaymentMethodName(data.payment_method),
        amount: data.amount,
      });

      // Reset form
      manualForm.reset();
    } catch (error) {
      console.error("Error depositing manually:", error);
      toast.error("Failed to process manual deposit");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle receipt upload
  const handleReceiptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      toast.error("Only JPEG, PNG, and GIF images are allowed");
      return;
    }

    setIsLoading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("receipt", file);

      // Upload receipt
      const response = await userApi.uploadReceipt(formData);

      // Set receipt URL
      setReceiptUrl(response.data.url);

      toast.success("Receipt uploaded successfully");
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error("Failed to upload receipt");
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

  // Payment method information
  const paymentMethodInfo = {
    bkash: {
      number: "01712345678",
      type: "Personal",
      instructions:
        "Send money to the number above and enter the Transaction ID, your name, and the number you sent from.",
    },
    nagad: {
      number: "01712345678",
      type: "Personal",
      instructions:
        "Send money to the number above and enter the Transaction ID, your name, and the number you sent from.",
    },
    rocket: {
      number: "01712345678",
      type: "Personal",
      instructions:
        "Send money to the number above and enter the Transaction ID, your name, and the number you sent from.",
    },
    bank_transfer: {
      accountName: "Investment App Ltd",
      accountNumber: "1234567890",
      bankName: "Bangladesh Bank",
      branchName: "Main Branch",
      instructions:
        "Transfer the amount to the account above and enter the Transaction ID, your name, and any reference information.",
    },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Deposit Funds</h1>

      {/* Success message */}
      {depositSuccess && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Deposit Initiated</AlertTitle>
          <AlertDescription>
            Your deposit of{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "BDT",
            }).format(depositSuccess.amount)}{" "}
            via {depositSuccess.method} has been initiated.
            {depositSuccess.redirectUrl && (
              <div className="mt-2">
                <Button
                  onClick={() =>
                    window.open(depositSuccess.redirectUrl, "_blank")
                  }
                  className="mt-2"
                >
                  Proceed to Payment
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="gateway" className="space-y-4">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="gateway">Payment Gateway</TabsTrigger>
          <TabsTrigger value="manual">Manual Deposit</TabsTrigger>
        </TabsList>

        <TabsContent value="gateway">
          <Card>
            <CardHeader>
              <CardTitle>Deposit via Payment Gateway</CardTitle>
              <CardDescription>
                Deposit funds instantly using our secure payment gateways
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (BDT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    {...gatewayForm.register("amount")}
                  />
                  {gatewayForm.formState.errors.amount && (
                    <p className="text-sm text-red-500">
                      {gatewayForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        gatewayForm.handleSubmit((data) =>
                          onGatewaySubmit(data, "coingate")
                        )();
                      }}
                      disabled={isLoading}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay with Crypto (CoinGate)
                    </Button>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        gatewayForm.handleSubmit((data) =>
                          onGatewaySubmit(data, "uddoktapay")
                        )();
                      }}
                      disabled={isLoading}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Pay with UddoktaPay
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2 font-medium">Payment Gateway Details:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    CoinGate: Pay with cryptocurrencies (BTC, ETH, LTC, etc.)
                  </li>
                  <li>
                    UddoktaPay: Pay with mobile banking (bKash, Nagad, Rocket)
                    or bank transfer
                  </li>
                  <li>
                    All deposits are processed instantly once payment is
                    confirmed
                  </li>
                  <li>Minimum deposit: 100 BDT</li>
                </ul>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Deposit</CardTitle>
              <CardDescription>
                Deposit funds manually using mobile banking or bank transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4 bg-muted/50">
                <div className="font-medium">Payment Instructions</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>1. Choose your preferred payment method below</p>
                  <p>2. Send the money to the provided account/number</p>
                  <p>3. Enter the transaction details in the form</p>
                  <p>
                    4. Upload a screenshot of your payment receipt (optional)
                  </p>
                  <p>5. Submit the form and wait for admin approval</p>
                </div>
              </div>

              <form
                className="space-y-6"
                onSubmit={manualForm.handleSubmit(onManualSubmit)}
              >
                <div className="space-y-2">
                  <Label htmlFor="manual_amount">Amount (BDT)</Label>
                  <Input
                    id="manual_amount"
                    type="number"
                    placeholder="Enter amount"
                    {...manualForm.register("amount")}
                  />
                  {manualForm.formState.errors.amount && (
                    <p className="text-sm text-red-500">
                      {manualForm.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Select Payment Method</Label>
                  <RadioGroup
                    defaultValue="bkash"
                    onValueChange={(value) =>
                      manualForm.setValue("payment_method", value as any)
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="bkash"
                        id="bkash"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="bkash"
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
                        id="nagad"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="nagad"
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
                        id="rocket"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="rocket"
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
                        id="bank_transfer"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="bank_transfer"
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
                  {manualForm.formState.errors.payment_method && (
                    <p className="text-sm text-red-500">
                      {manualForm.formState.errors.payment_method.message}
                    </p>
                  )}
                </div>

                {/* Payment method details */}
                <div className="rounded-md border p-4">
                  <h3 className="text-md font-medium mb-2">
                    {getPaymentMethodName(manualForm.watch("payment_method"))}{" "}
                    Details
                  </h3>

                  {manualForm.watch("payment_method") === "bank_transfer" ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Bank Name:
                        </span>
                        <span className="font-medium">
                          {paymentMethodInfo.bank_transfer.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Account Name:
                        </span>
                        <span className="font-medium">
                          {paymentMethodInfo.bank_transfer.accountName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Account Number:
                        </span>
                        <span className="font-medium">
                          {paymentMethodInfo.bank_transfer.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Branch:</span>
                        <span className="font-medium">
                          {paymentMethodInfo.bank_transfer.branchName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Number:</span>
                        <span className="font-medium">
                          {
                            paymentMethodInfo[
                              manualForm.watch(
                                "payment_method"
                              ) as keyof typeof paymentMethodInfo
                            ].number
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Account Type:
                        </span>
                        <span className="font-medium">
                          {
                            paymentMethodInfo[
                              manualForm.watch(
                                "payment_method"
                              ) as keyof typeof paymentMethodInfo
                            ].type
                          }
                        </span>
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              paymentMethodInfo[
                                manualForm.watch(
                                  "payment_method"
                                ) as keyof typeof paymentMethodInfo
                              ].number
                            );
                            toast.success("Number copied to clipboard");
                          }}
                        >
                          Copy Number
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Instructions:
                    </p>
                    <p>
                      {
                        paymentMethodInfo[
                          manualForm.watch(
                            "payment_method"
                          ) as keyof typeof paymentMethodInfo
                        ].instructions
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction ID</Label>
                  <Input
                    id="transaction_id"
                    placeholder="Enter transaction ID"
                    {...manualForm.register("transaction_id")}
                  />
                  {manualForm.formState.errors.transaction_id && (
                    <p className="text-sm text-red-500">
                      {manualForm.formState.errors.transaction_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_name">Sender Name</Label>
                  <Input
                    id="sender_name"
                    placeholder="Enter your name as shown in the transaction"
                    {...manualForm.register("sender_name")}
                  />
                  {manualForm.formState.errors.sender_name && (
                    <p className="text-sm text-red-500">
                      {manualForm.formState.errors.sender_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_number">Sender Number</Label>
                  <Input
                    id="sender_number"
                    placeholder="Enter your phone number used for the transaction"
                    {...manualForm.register("sender_number")}
                  />
                  {manualForm.formState.errors.sender_number && (
                    <p className="text-sm text-red-500">
                      {manualForm.formState.errors.sender_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                  <div className="flex items-center space-x-4">
                    {receiptUrl && (
                      <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                        <img
                          src={receiptUrl}
                          alt="Receipt"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("receipt")?.click()
                      }
                      disabled={isLoading}
                    >
                      {isLoading ? "Uploading..." : "Upload Receipt"}
                      <Upload className="ml-2 h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      id="receipt"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleReceiptUpload}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, or GIF. Max size 2MB.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Deposit Request"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <Alert
                variant="default"
                className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
              >
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Important Notice</AlertTitle>
                <AlertDescription>
                  Manual deposits require admin approval and may take up to 24
                  hours to process. Please make sure all information is correct
                  before submitting.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
