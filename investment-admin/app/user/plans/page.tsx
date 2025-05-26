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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { userApi } from "@/lib/user-api";
import { Plan } from "@/types/plan";
import { User } from "@/types/auth";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Zap,
  Package,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmPlanId, setConfirmPlanId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch plans and user data
  useEffect(() => {
    const fetchPlansAndUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch plans
        const plansResponse = await userApi.plans.getAll();
        if (plansResponse.error) {
          throw new Error(plansResponse.error);
        }

        if (plansResponse.data) {
          setPlans(plansResponse.data.plans);
        }

        // Fetch user profile to get current plan
        const profileResponse = await userApi.profile.getProfile();
        if (profileResponse.error) {
          throw new Error(profileResponse.error);
        }

        if (profileResponse.data) {
          setUser(profileResponse.data.user);

          // Find current plan
          if (plansResponse.data && plansResponse.data.plans.length > 0) {
            const userPlan = plansResponse.data.plans.find(
              (plan) => plan.id === profileResponse.data.user.plan_id
            );
            setCurrentPlan(userPlan || null);
          }
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlansAndUser();
  }, []);

  // Open purchase confirmation dialog
  const openPurchaseDialog = (planId: number) => {
    setConfirmPlanId(planId);
    setIsDialogOpen(true);
  };

  // Purchase a plan
  const purchasePlan = async () => {
    if (!confirmPlanId) return;

    setIsPurchasing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userApi.plans.purchase(confirmPlanId);

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccessMessage("Plan purchased successfully");

      // Update current plan
      if (response.data?.plan) {
        setCurrentPlan(response.data.plan);

        // Update user's plan ID
        if (user) {
          setUser({
            ...user,
            plan_id: response.data.plan.id,
          });
        }
      }

      // Close dialog after a delay
      setTimeout(() => {
        setIsDialogOpen(false);

        // Clear success message after dialog closes
        setTimeout(() => {
          setSuccessMessage(null);
        }, 500);
      }, 2000);
    } catch (err) {
      console.error("Error purchasing plan:", err);
      setError(err instanceof Error ? err.message : "Failed to purchase plan");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Render plan feature
  const renderPlanFeature = (
    value: number | boolean,
    label: string,
    icon: React.ReactNode,
    suffix = "",
    isHigherBetter = true
  ) => {
    let displayValue: React.ReactNode;
    let iconColor: string;

    if (typeof value === "boolean") {
      displayValue = value ? "Yes" : "No";
      iconColor = value ? "text-green-600" : "text-red-600";
    } else {
      displayValue = suffix
        ? `${formatCurrency(value, "")}${suffix}`
        : formatCurrency(value, "BDT");

      iconColor = isHigherBetter
        ? value > 0
          ? "text-green-600"
          : "text-red-600"
        : value > 0
        ? "text-blue-600"
        : "text-gray-600";
    }

    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <div className="flex items-center">
          <div className={cn("mr-2", iconColor)}>{icon}</div>
          <span className="text-sm">{label}</span>
        </div>
        <span className="font-medium">{displayValue}</span>
      </div>
    );
  };

  // Render plan card
  const renderPlanCard = (plan: Plan) => {
    const isCurrentPlan = currentPlan?.id === plan.id;

    return (
      <Card
        className={cn(
          "flex flex-col transition-all",
          isCurrentPlan && "border-green-500 shadow-md"
        )}
      >
        <CardHeader
          className={cn(
            "pb-2",
            isCurrentPlan && "bg-green-50 dark:bg-green-950/30"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.is_default ? "Basic Plan" : "Premium Plan"}
              </CardDescription>
            </div>

            {isCurrentPlan && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Current Plan
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="mt-2 mb-4">
            <div className="text-3xl font-bold">
              {formatCurrency(plan.price, "BDT")}
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.is_default ? "Free Plan" : "One-time purchase"}
            </p>
          </div>

          <div className="space-y-1 flex-1">
            {renderPlanFeature(
              plan.daily_deposit_limit,
              "Daily Deposit Limit",
              <ArrowDown className="h-4 w-4" />
            )}
            {renderPlanFeature(
              plan.daily_withdrawal_limit,
              "Daily Withdrawal Limit",
              <ArrowUp className="h-4 w-4" />
            )}
            {renderPlanFeature(
              plan.daily_profit_limit,
              "Daily Profit Limit",
              <TrendingUp className="h-4 w-4" />
            )}
            {renderPlanFeature(
              true,
              "Priority Support",
              <ShieldCheck className="h-4 w-4" />,
              "",
              true
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            className={cn(
              "w-full",
              isCurrentPlan && "bg-green-600 hover:bg-green-700"
            )}
            disabled={isCurrentPlan || isLoading}
            onClick={() => openPurchaseDialog(plan.id)}
          >
            {isCurrentPlan ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Current Plan
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                {plan.is_default ? "Default Plan" : "Upgrade Now"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Investment Plans</h2>
        <p className="text-muted-foreground">
          Choose a plan that fits your investment strategy
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

      {currentPlan && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 dark:text-blue-400">
              Your Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-blue-800 dark:text-blue-400">
                  {currentPlan.name}
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-500">
                  Daily Profit Limit:{" "}
                  {formatCurrency(currentPlan.daily_profit_limit, "BDT")}
                </p>
              </div>

              <div className="flex items-center text-blue-800 dark:text-blue-400">
                <Package className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {currentPlan.is_default ? "Free Plan" : "Premium Plan"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="h-7 w-32 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="h-8 w-24 bg-muted rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
                      <div className="h-5 w-20 bg-muted rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </CardFooter>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No plans available</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No investment plans are currently available.
            </p>
          </div>
        ) : (
          plans.map((plan) => renderPlanCard(plan))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Benefits</CardTitle>
          <CardDescription>
            Understanding how our plans help maximize your investments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpDown className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Higher Limits</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Premium plans provide higher daily deposit and withdrawal
                limits, allowing you to move larger amounts of money.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Increased Profits</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Access to higher daily profit limits means you can earn more
                from your investments each day.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Priority Support</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Premium plan users receive priority customer support, ensuring
                your questions are answered faster.
              </p>
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Plan upgrades are one-time purchases. You'll keep the benefits for
              as long as your account is active.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to purchase this plan?
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

          {confirmPlanId && (
            <div className="py-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {plans.find((p) => p.id === confirmPlanId)?.name ||
                        "Selected Plan"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      One-time purchase
                    </p>
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(
                      plans.find((p) => p.id === confirmPlanId)?.price || 0,
                      "BDT"
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Your current balance:{" "}
                  {formatCurrency(user?.balance || 0, "BDT")}
                </p>
                {(user?.balance || 0) <
                  (plans.find((p) => p.id === confirmPlanId)?.price || 0) && (
                  <Alert variant="destructive" className="mt-2">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      You don't have enough balance to purchase this plan.
                      Please deposit more funds.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPurchasing}
            >
              Cancel
            </Button>
            <Button
              onClick={purchasePlan}
              disabled={
                isPurchasing ||
                (user?.balance || 0) <
                  (plans.find((p) => p.id === confirmPlanId)?.price || 0)
              }
            >
              {isPurchasing ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
