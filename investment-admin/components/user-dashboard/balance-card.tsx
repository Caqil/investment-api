"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { User } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  user: User | null;
  referralEarnings: number;
  referralCode: string;
  isLoading: boolean;
}

export function BalanceCard({
  user,
  referralEarnings,
  referralCode,
  isLoading,
}: BalanceCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">Your Balance</CardTitle>
        <CardDescription>
          Current available balance in your account
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="mb-4">
          <div className="text-3xl font-bold mb-1">
            {isLoading ? (
              <div className="h-8 w-40 bg-muted animate-pulse rounded"></div>
            ) : (
              formatCurrency(user?.balance || 0, "BDT")
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              `Referral Earnings: ${formatCurrency(
                referralEarnings || 0,
                "BDT"
              )}`
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button
            className="flex-1"
            onClick={() => router.push("/user/deposits")}
          >
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => router.push("/user/withdrawals")}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
          <div className="text-sm font-medium mb-1">Your Referral Code</div>
          <div className="flex items-center justify-between">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
              {isLoading ? "Loading..." : referralCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopyReferralCode}
            >
              <Copy className={cn("h-4 w-4", copied ? "text-green-500" : "")} />
              <span className="sr-only">Copy code</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
