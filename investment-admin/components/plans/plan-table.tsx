// components/plans/plans-table.tsx
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Plan } from "@/types/plan";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export function PlansTable() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);

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

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeletePlan = async () => {
    if (!deletePlanId) return;

    setDeletingPlan(true);
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
      setDeletingPlan(false);
      setShowDeleteDialog(false);
      setDeletePlanId(null);
    }
  };

  const handleSetDefaultPlan = async (planId: number) => {
    setSettingDefault(true);
    try {
      // Find the plan to update
      const planToUpdate = plans.find((plan) => plan.id === planId);
      if (!planToUpdate) throw new Error("Plan not found");

      // Call the API to update the plan
      const response = await api.plans.update(planId, {
        ...planToUpdate,
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
      setSettingDefault(false);
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
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            {error}
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
                {filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className={plan.is_default ? "bg-primary/5" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {plan.name}
                          {plan.is_default && (
                            <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                              Default
                            </Badge>
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
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Default Plan
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard Plan</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/plans/${plan.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Plan
                              </Link>
                            </DropdownMenuItem>
                            {!plan.is_default && (
                              <DropdownMenuItem
                                onClick={() => handleSetDefaultPlan(plan.id)}
                                disabled={settingDefault}
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
                    <TableCell colSpan={7} className="text-center py-4">
                      No plans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

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
              disabled={deletingPlan}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlan}
              disabled={deletingPlan}
            >
              {deletingPlan ? (
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
