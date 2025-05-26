"use client";

import { useState } from "react";
import { User } from "@/types/auth";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  LockIcon,
  UnlockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserX,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserDetailsDialog } from "./user-detail-dialog";

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

export function UsersTable({ users, loading, onRefresh }: UsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewUserDetails = (userId: number) => {
    console.log("Opening user details dialog for user ID:", userId);
    setSelectedUserId(userId);
    setShowUserDetailsDialog(true);
  };

  const handleBlockUser = async () => {
    if (!actionUser) return;

    setActionLoading(true);
    try {
      const response = await api.users.block(actionUser.id);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowBlockDialog(false);
      onRefresh();
    } catch (err) {
      console.error("Error blocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to block user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!actionUser) return;

    setActionLoading(true);
    try {
      const response = await api.users.unblock(actionUser.id);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowUnblockDialog(false);
      onRefresh();
    } catch (err) {
      console.error("Error unblocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to unblock user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!actionUser) return;

    setActionLoading(true);
    try {
      const response = await api.users.delete(actionUser.id);

      if (response.error) {
        throw new Error(response.error);
      }

      setShowDeleteDialog(false);
      onRefresh();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-md p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Eye className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No users found</h3>
          <p className="text-sm   mt-1">
            There are no users matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Balance
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium ">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">{user.name}</div>
                        {user.is_admin && (
                          <Badge
                            variant="outline"
                            className="bg-purple-100 text-purple-800 hover:bg-purple-100"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm  ">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm  ">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm  ">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "BDT",
                    }).format(user.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm  ">
                    {user.is_blocked ? (
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-800 hover:bg-red-100"
                      >
                        Blocked
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 hover:bg-green-100"
                      >
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm  ">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUserDetails(user.id)}
                      className="h-8 gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>

                    {user.is_blocked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActionUser(user);
                          setShowUnblockDialog(true);
                        }}
                        className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 ml-2"
                      >
                        <UnlockIcon className="h-4 w-4" />
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActionUser(user);
                          setShowBlockDialog(true);
                        }}
                        className="h-8 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 ml-2"
                      >
                        <LockIcon className="h-4 w-4" />
                        Block
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActionUser(user);
                        setShowDeleteDialog(true);
                      }}
                      className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <UserX className="h-4 w-4" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <UserDetailsDialog
        userId={selectedUserId}
        open={showUserDetailsDialog}
        onOpenChange={setShowUserDetailsDialog}
        onAction={onRefresh}
      />
      {/* Block User Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {actionUser?.name}? They will not
              be able to log in or use the system while blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {actionLoading ? "Blocking..." : "Block User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock User Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock {actionUser?.name}? They will
              regain access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblockUser}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Unblocking..." : "Unblock User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {actionUser?.name}?
              This action cannot be undone and will remove all their data from
              the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
