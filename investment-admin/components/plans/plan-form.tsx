"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plan } from "@/types/plan";

interface PlanFormValues {
  name: string;
  daily_deposit_limit: number;
  daily_withdrawal_limit: number;
  daily_profit_limit: number;
  price: number;
  is_default: boolean;
}

interface PlanFormProps {
  initialData?: Plan;
  onSubmit: (data: PlanFormValues) => Promise<boolean>;
  onCancel: () => void;
}

export function PlanForm({ initialData, onSubmit, onCancel }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PlanFormValues, string>>
  >({});

  // Initialize form state with default values
  const [formValues, setFormValues] = useState<PlanFormValues>({
    name: initialData?.name || "",
    daily_deposit_limit: initialData?.daily_deposit_limit || 1000,
    daily_withdrawal_limit: initialData?.daily_withdrawal_limit || 500,
    daily_profit_limit: initialData?.daily_profit_limit || 200,
    price: initialData?.price || 0,
    is_default: initialData?.is_default || false,
  });

  // Handle input change
  const handleChange = (
    field: keyof PlanFormValues,
    value: string | number | boolean
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when it changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PlanFormValues, string>> = {};

    if (!formValues.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formValues.daily_deposit_limit < 0) {
      newErrors.daily_deposit_limit =
        "Daily deposit limit must be a positive number";
    }

    if (formValues.daily_withdrawal_limit < 0) {
      newErrors.daily_withdrawal_limit =
        "Daily withdrawal limit must be a positive number";
    }

    if (formValues.daily_profit_limit < 0) {
      newErrors.daily_profit_limit =
        "Daily profit limit must be a positive number";
    }

    if (formValues.price < 0) {
      newErrors.price = "Price must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(formValues);
      if (success) {
        // Reset form if successful and it's a new form
        if (!initialData) {
          setFormValues({
            name: "",
            daily_deposit_limit: 1000,
            daily_withdrawal_limit: 500,
            daily_profit_limit: 200,
            price: 0,
            is_default: false,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formValues.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Premium Plan"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm font-medium text-red-500 mt-1">
              {errors.name}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            The name of the investment plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (BDT)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formValues.price}
              onChange={(e) =>
                handleChange("price", parseFloat(e.target.value))
              }
              placeholder="0.00"
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && (
              <p className="text-sm font-medium text-red-500 mt-1">
                {errors.price}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              The price users will pay to purchase this plan.
            </p>
          </div>

          <div>
            <Label htmlFor="daily_deposit_limit">
              Daily Deposit Limit (BDT)
            </Label>
            <Input
              id="daily_deposit_limit"
              type="number"
              min="0"
              step="0.01"
              value={formValues.daily_deposit_limit}
              onChange={(e) =>
                handleChange("daily_deposit_limit", parseFloat(e.target.value))
              }
              placeholder="1000.00"
              className={errors.daily_deposit_limit ? "border-red-500" : ""}
            />
            {errors.daily_deposit_limit && (
              <p className="text-sm font-medium text-red-500 mt-1">
                {errors.daily_deposit_limit}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Maximum amount users can deposit daily.
            </p>
          </div>

          <div>
            <Label htmlFor="daily_withdrawal_limit">
              Daily Withdrawal Limit (BDT)
            </Label>
            <Input
              id="daily_withdrawal_limit"
              type="number"
              min="0"
              step="0.01"
              value={formValues.daily_withdrawal_limit}
              onChange={(e) =>
                handleChange(
                  "daily_withdrawal_limit",
                  parseFloat(e.target.value)
                )
              }
              placeholder="500.00"
              className={errors.daily_withdrawal_limit ? "border-red-500" : ""}
            />
            {errors.daily_withdrawal_limit && (
              <p className="text-sm font-medium text-red-500 mt-1">
                {errors.daily_withdrawal_limit}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Maximum amount users can withdraw daily.
            </p>
          </div>

          <div>
            <Label htmlFor="daily_profit_limit">Daily Profit Limit (BDT)</Label>
            <Input
              id="daily_profit_limit"
              type="number"
              min="0"
              step="0.01"
              value={formValues.daily_profit_limit}
              onChange={(e) =>
                handleChange("daily_profit_limit", parseFloat(e.target.value))
              }
              placeholder="200.00"
              className={errors.daily_profit_limit ? "border-red-500" : ""}
            />
            {errors.daily_profit_limit && (
              <p className="text-sm font-medium text-red-500 mt-1">
                {errors.daily_profit_limit}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Maximum profit users can earn daily.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="is_default"
            checked={formValues.is_default}
            onCheckedChange={(checked) =>
              handleChange("is_default", Boolean(checked))
            }
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="is_default">Set as Default Plan</Label>
            <p className="text-sm text-muted-foreground">
              If checked, this plan will be the default for new users. Only one
              plan can be the default.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}
