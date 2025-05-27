"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Check,
  AlertTriangle,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Plan } from "@/types/plan";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PlanForm } from "@/components/plans/plan-form";

export function PlansTable() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.plans.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && "plans" in response.data) {
        const fetchedPlans = response.data.plans as Plan[];
        // Sort plans by default status first, then by price
        const sortedPlans = fetchedPlans.sort((a, b) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return a.price - b.price;
        });
        setPlans(sortedPlans);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Filter plans based on search query
  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredPlans.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get current page data
  const currentPlans = filteredPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowEditDialog(true);
  };

  const handleCreatePlan = () => {
    setShowCreateDialog(true);
  };

  const handleDeletePlan = async () => {
    if (!deletePlanId) return;

    setIsSubmitting(true);
    try {
      const response = await api.plans.delete(deletePlanId);

      if (response.error) {
        throw new Error(response.error);
      }

      // Remove plan from state
      setPlans(plans.filter((plan) => plan.id !== deletePlanId));
      toast.success("Plan deleted successfully");
    } catch (err) {
      console.error("Error deleting plan:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete plan");
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setDeletePlanId(null);
    }
  };

  const handleSetDefaultPlan = async (planId: number) => {
    setIsSubmitting(true);
    try {
      // Find the plan to update
      const planToUpdate = plans.find((plan) => plan.id === planId);
      if (!planToUpdate) throw new Error("Plan not found");

      // Call the API to update the plan
      const response = await api.plans.update(planId, {
        name: planToUpdate.name,
        daily_deposit_limit: planToUpdate.daily_deposit_limit,
        daily_withdrawal_limit: planToUpdate.daily_withdrawal_limit,
        daily_profit_limit: planToUpdate.daily_profit_limit,
        price: planToUpdate.price,
        is_default: true,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update plans in state - set all to non-default except this one
      setPlans(
        plans.map((plan) => ({
          ...plan,
          is_default: plan.id === planId,
        }))
      );

      toast.success("Default plan updated successfully");
    } catch (err) {
      console.error("Error setting default plan:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to set default plan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCreatePlan = async (planData: any) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await api.plans.create({
        name: planData.name,
        daily_deposit_limit: planData.daily_deposit_limit,
        daily_withdrawal_limit: planData.daily_withdrawal_limit,
        daily_profit_limit: planData.daily_profit_limit,
        price: planData.price,
        is_default: planData.is_default,
      });

      if (response.error) {
        setFormError(response.error);
        return false;
      }

      // Add the new plan to the state
      await fetchPlans();
      toast.success("Plan created successfully");
      setShowCreateDialog(false);
      return true;
    } catch (err) {
      console.error("Error creating plan:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create plan";
      setFormError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEditPlan = async (planData: any) => {
    if (!selectedPlan) return false;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await api.plans.update(selectedPlan.id, {
        name: planData.name,
        daily_deposit_limit: planData.daily_deposit_limit,
        daily_withdrawal_limit: planData.daily_withdrawal_limit,
        daily_profit_limit: planData.daily_profit_limit,
        price: planData.price,
        is_default: planData.is_default,
      });

      if (response.error) {
        setFormError(response.error);
        return false;
      }

      // Update the plan in the state
      const updatedPlans = plans.map((plan) =>
        plan.id === selectedPlan.id
          ? { ...plan, ...planData }
          : planData.is_default
          ? { ...plan, is_default: false }
          : plan
      );
      setPlans(updatedPlans);

      toast.success("Plan updated successfully");
      setShowEditDialog(false);
      return true;
    } catch (err) {
      console.error("Error updating plan:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update plan";
      setFormError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Investment Plans</CardTitle>
          <CardDescription>
            Manage subscription plans for your users
          </CardDescription>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search plans..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Daily Deposit Limit
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Daily Withdrawal Limit
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Daily Profit Limit
                  </TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPlans.length > 0 ? (
                  currentPlans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className={plan.is_default ? "bg-muted/50" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {plan.name}
                          {plan.is_default && (
                            <Badge className="ml-2">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatCurrency(plan.daily_deposit_limit, "BDT")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatCurrency(plan.daily_withdrawal_limit, "BDT")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatCurrency(plan.daily_profit_limit, "BDT")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={plan.price === 0 ? "outline" : "secondary"}
                        >
                          {formatCurrency(plan.price, "BDT")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plan.is_default ? (
                          <Badge variant="outline">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isSubmitting}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Plan
                            </DropdownMenuItem>
                            {!plan.is_default && (
                              <DropdownMenuItem
                                onClick={() => handleSetDefaultPlan(plan.id)}
                                disabled={isSubmitting}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Set as Default
                              </DropdownMenuItem>
                            )}
                            {!plan.is_default && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletePlanId(plan.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive"
                                disabled={isSubmitting}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Plan
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Info className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No plans found</p>
                        {searchQuery && (
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search query
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreatePlan}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Plan
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

           
          </div>
        )}
      </CardContent>
      {filteredPlans.length > 0 && (
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            {filteredPlans.length}{" "}
            {filteredPlans.length === 1 ? "plan" : "plans"} found
          </div>
          <Button variant="outline" size="sm" onClick={handleCreatePlan}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Plan
          </Button>
        </CardFooter>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Add a new subscription plan for your users.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {formError}
            </div>
          )}
          <PlanForm
            onSubmit={handleSubmitCreatePlan}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the details of {selectedPlan?.name} plan.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {formError}
            </div>
          )}
          {selectedPlan && (
            <PlanForm
              initialData={selectedPlan}
              onSubmit={handleSubmitEditPlan}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Plan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this plan? This action cannot be
              undone, and any users currently subscribed to this plan will be
              affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
