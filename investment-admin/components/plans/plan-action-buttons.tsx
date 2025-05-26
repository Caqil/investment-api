"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Plan } from "@/types/plan";
import { PlanForm } from "./plan-form";
import { usePlans } from "@/hooks/use-plan";

interface PlanActionsProps {
  plan: Plan;
  onRefresh: () => void;
  onError: (message: string) => void;
}

export function PlanActions({ plan, onRefresh, onError }: PlanActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { updatePlan, deletePlan } = usePlans();

  const handleUpdatePlan = async (planData: Partial<Plan>) => {
    setLoading(true);
    setFormError(null);

    const { success, error } = await updatePlan(plan.id, planData);

    if (!success && error) {
      setFormError(error);
      onError(error);
      setLoading(false);
      return false;
    }

    setIsEditDialogOpen(false);
    onRefresh();
    setLoading(false);
    return true;
  };

  const handleDeletePlan = async () => {
    if (plan.is_default) {
      onError(
        "Cannot delete the default plan. Please set another plan as default first."
      );
      setIsDeleteDialogOpen(false);
      return;
    }

    setLoading(true);
    const { success, error } = await deletePlan(plan.id);

    if (!success && error) {
      onError(error);
    } else {
      setIsDeleteDialogOpen(false);
      onRefresh();
    }

    setLoading(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Plan
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={plan.is_default}
            className={plan.is_default ? "text-gray-400" : "text-red-600"}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Plan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the details of {plan.name} plan.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
              {formError}
            </div>
          )}
          <PlanForm
            initialData={plan}
            onSubmit={handleUpdatePlan}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Plan Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Plan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan &quot;{plan.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {plan.is_default && (
            <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
              This is the default plan and cannot be deleted. Please set another
              plan as default first.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={loading || plan.is_default}
            >
              {loading ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
