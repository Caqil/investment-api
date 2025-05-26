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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import { User } from "@/types/auth";
import { Transaction, TransactionType } from "@/types/transaction";
import {
  Copy,
  Share,
  CheckCircle,
  Users,
  Award,
  UserCheck,
  UserPlus,
  Link,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<User[]>([]);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referralTransactions, setReferralTransactions] = useState<
    Transaction[]
  >([]);

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch referrals data
  useEffect(() => {
    const fetchReferralsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch referrals
        const referralsResponse = await userApi.referrals.getAll();
        if (referralsResponse.error) {
          throw new Error(referralsResponse.error);
        }

        if (referralsResponse.data) {
          setReferrals(referralsResponse.data.referrals);
          setTotalReferrals(referralsResponse.data.total_referrals);
          setReferralEarnings(referralsResponse.data.total_earnings);
        }

        // Fetch referral code and earnings
        const earningsResponse = await userApi.referrals.getEarnings();
        if (earningsResponse.error) {
          throw new Error(earningsResponse.error);
        }

        if (earningsResponse.data) {
          setReferralCode(earningsResponse.data.referral_code);
          // If the first API didn't return earnings, use this one
          if (!referralsResponse.data) {
            setTotalReferrals(earningsResponse.data.total_referrals);
            setReferralEarnings(earningsResponse.data.total_earnings);
          }
        }

        // Fetch transactions
        const transactionsResponse = await userApi.transactions.getAll();
        if (transactionsResponse.error) {
          throw new Error(transactionsResponse.error);
        }

        if (transactionsResponse.data) {
          setTransactions(transactionsResponse.data.transactions);

          // Filter for referral transactions
          const referralTxs = transactionsResponse.data.transactions.filter(
            (t) =>
              t.type === TransactionType.REFERRAL_BONUS ||
              t.type === TransactionType.REFERRAL_PROFIT
          );
          setReferralTransactions(referralTxs);
        }
      } catch (err) {
        console.error("Error fetching referrals data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load referrals data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralsData();
  }, []);

  // Get referral link
  const getReferralLink = () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://example.com";
    return `${baseUrl}/register?ref=${referralCode}`;
  };

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setSuccessMessage("Referral code copied to clipboard");

    setTimeout(() => {
      setCopiedCode(false);
      setSuccessMessage(null);
    }, 2000);
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    setCopiedLink(true);
    setSuccessMessage("Referral link copied to clipboard");

    setTimeout(() => {
      setCopiedLink(false);
      setSuccessMessage(null);
    }, 2000);
  };

  // Share referral link
  const shareReferralLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Join me on Investment Platform",
          text: "Sign up using my referral code and earn a bonus!",
          url: getReferralLink(),
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Referrals</h2>
        <p className="text-muted-foreground">
          Invite friends and earn bonuses for each referral
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Referrals</CardTitle>
            <CardDescription>Number of users you've referred</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-3xl font-bold">
                {isLoading ? "..." : totalReferrals}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>Earnings from your referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-3xl font-bold">
                {isLoading ? "..." : formatCurrency(referralEarnings, "BDT")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>Share this code with your friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-2">
              <code className="bg-muted px-2 py-1 rounded text-base font-semibold">
                {isLoading ? "Loading..." : referralCode}
              </code>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyReferralCode}
                  className={cn(
                    "transition-colors",
                    copiedCode && "text-green-600"
                  )}
                >
                  {copiedCode ? (
                    <CheckCheck className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy code</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={shareReferralLink}>
                  <Share className="h-4 w-4" />
                  <span className="sr-only">Share</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-2">
              <span className="text-sm truncate w-[70%]">
                {isLoading ? "Loading..." : getReferralLink()}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyReferralLink}
                  className={cn(
                    "transition-colors",
                    copiedLink && "text-green-600"
                  )}
                >
                  {copiedLink ? (
                    <CheckCheck className="h-4 w-4" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy link</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="referrals">
            <UserPlus className="h-4 w-4 mr-2" />
            My Referrals
          </TabsTrigger>
          <TabsTrigger value="earnings">
            <Award className="h-4 w-4 mr-2" />
            Referral Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referred Users</CardTitle>
              <CardDescription>
                Users who signed up using your referral code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-[200px] bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-[160px] bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <UserPlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No referrals yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Share your referral code to start earning bonuses.
                  </p>
                  <Button className="mt-4" onClick={copyReferralLink}>
                    <Link className="mr-2 h-4 w-4" />
                    Copy Referral Link
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>KYC Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={referral.profile_pic_url}
                                  alt={referral.name}
                                />
                                <AvatarFallback>
                                  {referral.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{referral.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(referral.created_at)}
                          </TableCell>
                          <TableCell>
                            {referral.is_kyc_verified ? (
                              <div className="flex items-center text-green-600">
                                <UserCheck className="mr-2 h-4 w-4" />
                                <span>Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-yellow-600">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                <span>Pending</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
              <CardDescription>
                Your earnings from referral bonuses and profits
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
              ) : referralTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No earnings yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Refer users to earn bonuses and profit shares.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {formatDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            {transaction.type === TransactionType.REFERRAL_BONUS
                              ? "Referral Bonus"
                              : "Profit Share"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description || "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            +{formatCurrency(transaction.amount, "BDT")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>How our referral program works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  1
                </div>
                <h3 className="font-semibold">Share Your Code</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Share your unique referral code or link with friends, family,
                and on social media.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  2
                </div>
                <h3 className="font-semibold">Friends Sign Up</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                When someone signs up using your referral code, they become your
                referral.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  3
                </div>
                <h3 className="font-semibold">Earn Rewards</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Earn a one-time bonus when they sign up and a percentage of
                their daily profits.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start border-t p-4">
          <h3 className="font-semibold mb-2">Referral Rewards</h3>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li>
              One-time <span className="font-medium">500 BDT bonus</span> for
              each successful referral
            </li>
            <li>
              <span className="font-medium">10% daily profit share</span> from
              all your referrals' earnings
            </li>
            <li>
              Both you and your referral receive bonuses when they sign up
            </li>
            <li>No limit to how many people you can refer</li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
}
