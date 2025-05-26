"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plan } from "@/types/plan";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Users,
  DollarSign,
  BadgeDollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface PlanStatsProps {
  plans: Plan[];
  loading: boolean;
}

export function PlanStats({ plans, loading }: PlanStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate stats
  const totalPlans = plans.length;
  const freePlans = plans.filter((p) => p.price === 0).length;
  const paidPlans = totalPlans - freePlans;

  // Find highest and lowest priced plans (excluding free plans)
  const paidPlansSorted = plans
    .filter((p) => p.price > 0)
    .sort((a, b) => a.price - b.price);
  const lowestPricedPlan = paidPlansSorted[0]?.price || 0;
  const highestPricedPlan =
    paidPlansSorted[paidPlansSorted.length - 1]?.price || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPlans}</div>
          <p className="text-xs text-muted-foreground">
            {freePlans} free, {paidPlans} paid
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Default Plan</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {plans.find((p) => p.is_default)?.name || "None"}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(plans.find((p) => p.is_default)?.price || 0, "BDT")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
          <ArrowDown className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(lowestPricedPlan, "BDT")}
          </div>
          <p className="text-xs text-muted-foreground">
            {paidPlansSorted[0]?.name || "No paid plans"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
          <ArrowUp className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(highestPricedPlan, "BDT")}
          </div>
          <p className="text-xs text-muted-foreground">
            {paidPlansSorted[paidPlansSorted.length - 1]?.name ||
              "No paid plans"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
