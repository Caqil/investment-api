// src/components/withdrawals/withdrawals-table.tsx
import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "../ui/badge";
import { Withdrawal } from "../../types/withdrawal";
import { ApproveWithdrawalDialog } from "./approve-dialog";
import { RejectWithdrawalDialog } from "./reject-dialog";

interface WithdrawalsTableProps {
  withdrawals: Withdrawal[];
  isLoading: boolean;
  error: string | null;
  showActions?: boolean;
  onApprove?: (id: number, adminNote: string) => Promise<void>;
  onReject?: (id: number, reason: string) => Promise<void>;
}

export function WithdrawalsTable({
  withdrawals,
  isLoading,
  error,
  showActions = true,
  onApprove,
  onReject,
}: WithdrawalsTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            {showActions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 6 : 5}
                className="text-center text-muted-foreground py-6"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : withdrawals.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 6 : 5}
                className="text-center text-muted-foreground py-6"
              >
                No withdrawals found
              </TableCell>
            </TableRow>
          ) : (
            withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <div className="font-medium">User #{withdrawal.user_id}</div>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BDT",
                  }).format(withdrawal.amount)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{withdrawal.payment_method}</div>
                  <div className="text-xs text-muted-foreground">
                    {Object.keys(withdrawal.payment_details).map((key) => (
                      <div key={key}>
                        {key}:{" "}
                        {typeof withdrawal.payment_details[key] === "string"
                          ? withdrawal.payment_details[key]
                          : JSON.stringify(withdrawal.payment_details[key])}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(withdrawal.created_at), "PP")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(withdrawal.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      withdrawal.status === "approved"
                        ? "default"
                        : withdrawal.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {withdrawal.status}
                  </Badge>
                  {withdrawal.admin_note && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Note: {withdrawal.admin_note}
                    </div>
                  )}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/withdrawals/${withdrawal.id}`} passHref>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>

                      {onApprove && (
                        <ApproveWithdrawalDialog
                          withdrawal={withdrawal}
                          onApprove={onApprove}
                        />
                      )}

                      {onReject && (
                        <RejectWithdrawalDialog
                          withdrawal={withdrawal}
                          onReject={onReject}
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
