"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlansTable } from "@/components/plans/plans-table";
import { PlanFormDialog } from "@/components/plans/plan-form-dialog";
import { plansApi } from "@/lib/api";
import { Plan } from "@/types/plan";
import { useToast } from "@/components/ui/use-toast";
import { PlusIcon } from "lucide-react";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Fetch plans data
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const data = await plansApi.getAll();
        setPlans(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching plans:", error);
        setError("Failed to load plans data");
        toast({
          title: "Error",
          description: "Failed to load plans data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  // Handle plan creation
  const handleCreatePlan = async (planData: {
    name: string;
    daily_deposit_limit: number;
    daily_withdrawal_limit: number;
    daily_profit_limit: number;
    price: number;
    is_default: boolean;
  }) => {
    try {
      const newPlan = await plansApi.create(planData);

      // If new plan is default, update other plans
      if (newPlan.is_default) {
        setPlans((prevPlans) =>
          prevPlans.map((plan) => ({
            ...plan,
            is_default: plan.id === newPlan.id,
          }))
        );
      } else {
        setPlans((prevPlans) => [...prevPlans, newPlan]);
      }

      setShowCreateForm(false);

      toast({
        title: "Success",
        description: "Plan created successfully",
      });
    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Error",
        description: "Failed to create plan",
        variant: "destructive",
      });
    }
  };

  // Handle plan update
  const handleUpdatePlan = async (
    id: number,
    planData: {
      name: string;
      daily_deposit_limit: number;
      daily_withdrawal_limit: number;
      daily_profit_limit: number;
      price: number;
      is_default: boolean;
    }
  ) => {
    try {
      const updatedPlan = await plansApi.update(id, planData);

      // Update plans list
      setPlans((prevPlans) => {
        // If updated plan is default, update other plans
        if (updatedPlan.is_default) {
          return prevPlans.map((plan) => ({
            ...plan,
            is_default: plan.id === updatedPlan.id,
          }));
        }

        // Otherwise just update the specific plan
        return prevPlans.map((plan) =>
          plan.id === updatedPlan.id ? updatedPlan : plan
        );
      });

      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  // Handle plan deletion
  const handleDeletePlan = async (id: number) => {
    try {
      await plansApi.delete(id);

      // Remove plan from list
      setPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== id));

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete plan. Default plans cannot be deleted.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Subscription Plans
          </h2>
          <p className="text-muted-foreground">
            Manage pricing and subscription plans for users
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      {/* Create Plan Form Dialog */}
      <PlanFormDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreatePlan}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CardDescription>Available subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Default Plan</CardTitle>
            <CardDescription>Free tier for new users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.find((plan) => plan.is_default)?.name || "None"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Premium Plans</CardTitle>
            <CardDescription>Paid subscription tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.filter((plan) => !plan.is_default).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <PlansTable
        plans={plans}
        isLoading={isLoading}
        error={error}
        onUpdatePlan={handleUpdatePlan}
        onDeletePlan={handleDeletePlan}
      />
    </div>
  );
}
