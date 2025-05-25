// src/components/plans/delete-plan-dialog.tsx
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Plan } from "../../types/plan";

interface DeletePlanDialogProps {
  plan: Plan;
  onDelete: () => Promise<void>;
  trigger: React.ReactNode;
}

export function DeletePlanDialog({
  plan,
  onDelete,
  trigger,
}: DeletePlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      await onDelete();
      setIsOpen(false);
    } catch (error) {
      console.error("Error deleting plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Plan</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the "{plan.name}" plan?
            {plan.is_default && (
              <span className="text-destructive font-semibold block mt-2">
                Warning: You cannot delete the default plan!
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete the plan
            and remove it from the system.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || plan.is_default}
          >
            {isLoading ? "Deleting..." : "Delete Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
