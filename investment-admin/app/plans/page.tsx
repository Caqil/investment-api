"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlanList } from "@/components/plans/plan-list";
import { PlanStats } from "@/components/plans/plan-stats";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Plan } from "@/types/plan";
import { PlanForm } from "@/components/plans/plan-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlans } from "@/hooks/use-plan";

export default function PlansPage() {
  const { plans, loading, error, fetchPlans, createPlan } = usePlans();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreatePlan = async (planData: Partial<Plan>) => {
    setFormError(null);
    const { success, error } = await createPlan(planData);

    if (!success && error) {
      setFormError(error);
      return false;
    }

    setIsCreateDialogOpen(false);
    return true;
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Investment Plans</h1>
        <div className="flex gap-2">
          <Button onClick={fetchPlans} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <PlanStats plans={plans} loading={loading} />

      <PlanList
        plans={plans}
        loading={loading}
        onRefresh={fetchPlans}
        onError={(message) => setFormError(message)}
      />

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Create a new investment plan for your users.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
              {formError}
            </div>
          )}
          <PlanForm
            onSubmit={handleCreatePlan}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
