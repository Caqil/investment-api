// src/components/dashboard/overview.tsx
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface OverviewProps {
  totalDeposits: number;
  totalWithdrawals: number;
}

export function Overview({ totalDeposits, totalWithdrawals }: OverviewProps) {
  // Sample data - In a real application, you'd fetch this from your API
  const data = [
    { name: "Jan", deposits: 4000, withdrawals: 2400 },
    { name: "Feb", deposits: 3000, withdrawals: 1398 },
    { name: "Mar", deposits: 2000, withdrawals: 9800 },
    { name: "Apr", deposits: 2780, withdrawals: 3908 },
    { name: "May", deposits: 1890, withdrawals: 4800 },
    { name: "Jun", deposits: 2390, withdrawals: 3800 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Overview</CardTitle>
        <CardDescription>
          Total Deposits:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "BDT",
          }).format(totalDeposits)}{" "}
          | Total Withdrawals:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "BDT",
          }).format(totalWithdrawals)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deposits" name="Deposits" fill="#22c55e" />
              <Bar dataKey="withdrawals" name="Withdrawals" fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

