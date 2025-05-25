// src/components/plans/plans-table.tsx
import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DeletePlanDialog } from "./delete-plan-dialog";
import { Edit2, Trash2 } from "lucide-react";
import { Plan } from "../../types/plan";
import { PlanFormDialog } from "./plan-form";

interface PlansTableProps {
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  onUpdatePlan: (
    id: number,
    planData: {
      name: string;
      daily_deposit_limit: number;
      daily_withdrawal_limit: number;
      daily_profit_limit: number;
      price: number;
      is_default: boolean;
    }
  ) => Promise<void>;
  onDeletePlan: (id: number) => Promise<void>;
}

export function PlansTable({
  plans,
  isLoading,
  error,
  onUpdatePlan,
  onDeletePlan,
}: PlansTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Daily Deposit Limit</TableHead>
            <TableHead>Daily Withdrawal Limit</TableHead>
            <TableHead>Daily Profit Limit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <div className="h-9 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-9 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-6"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : plans.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-6"
              >
                No plans found. Create your first plan to get started.
              </TableCell>
            </TableRow>
          ) : (
            plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  {plan.price === 0
                    ? "Free"
                    : new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "BDT",
                      }).format(plan.price)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(plan.daily_deposit_limit)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(plan.daily_withdrawal_limit)}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(plan.daily_profit_limit)}
                </TableCell>
                <TableCell>
                  {plan.is_default ? (
                    <Badge>Default</Badge>
                  ) : (
                    <Badge variant="outline">Premium</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <PlanFormDialog
                      plan={plan}
                      onSubmit={(data) => onUpdatePlan(plan.id, data)}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      }
                    />

                    <DeletePlanDialog
                      plan={plan}
                      onDelete={() => onDeletePlan(plan.id)}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
