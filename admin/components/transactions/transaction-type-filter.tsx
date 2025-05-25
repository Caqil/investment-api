// src/components/transactions/transaction-type-filter.tsx
import React from "react";
import { Card, CardContent } from "../ui/card";
import { TransactionType } from "../../types/transaction";

interface TransactionTypeFilterProps {
  selectedType: TransactionType | "all";
  onTypeChange: (type: TransactionType | "all") => void;
}

export function TransactionTypeFilter({
  selectedType,
  onTypeChange,
}: TransactionTypeFilterProps) {
  const types: { value: TransactionType | "all"; label: string }[] = [
    { value: "all", label: "All Transactions" },
    { value: "deposit", label: "Deposits" },
    { value: "withdrawal", label: "Withdrawals" },
    { value: "bonus", label: "Daily Bonuses" },
    { value: "referral_bonus", label: "Referral Bonuses" },
    { value: "plan_purchase", label: "Plan Purchases" },
    { value: "referral_profit", label: "Referral Profits" },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type.value}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
              onClick={() => onTypeChange(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
