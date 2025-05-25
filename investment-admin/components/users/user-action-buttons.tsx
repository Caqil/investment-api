"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { MoreHorizontal, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { User } from "@/types/auth";
import { api } from "@/lib/api";

interface UserActionButtonsProps {
  user: User;
  onUserUpdate?: (updatedUser: User) => void;
  compact?: boolean;
}

export function UserActionButtons({
  user,
  onUserUpdate,
  compact = false,
}: UserActionButtonsProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState<boolean>(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState<boolean>(false);
  const router = useRouter();

  // Handle block/unblock user
  const handleBlockUser = async (isBlocked: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = isBlocked
        ? await api.users.unblock(user.id)
        : await api.users.block(user.id);

      if (response.error) {
        setError(response.error);
        return;
      }

      // Close dialogs
      setShowBlockDialog(false);
      setShowUnblockDialog(false);

      // Update user in parent component if callback exists
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          is_blocked: !isBlocked,
        });
      }

      // Refresh page data
      router.refresh();
    } catch (err) {
      setError(
        `Failed to ${isBlocked ? "unblock" : "block"} user. Please try again.`
      );
      console.error(
        `Error ${isBlocked ? "unblocking" : "blocking"} user:`,
        err
      );
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.is_blocked ? (
            <DropdownMenuItem onSelect={() => setShowUnblockDialog(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Unblock user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setShowBlockDialog(true)}>
              <UserX className="h-4 w-4 mr-2" />
              Block user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex gap-2">
      {user.is_blocked ? (
        <>
          <Dialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Unblock User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unblock User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to unblock this user? They will be able
                  to use the platform again.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {error}
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowUnblockDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleBlockUser(true)}
                  disabled={loading}
                >
                  {loading ? "Unblocking..." : "Unblock User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
              >
                <UserX className="h-4 w-4" />
                Block User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Block User
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to block this user? They will no longer
                  be able to access the platform.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {error}
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBlockDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBlockUser(false)}
                  disabled={loading}
                >
                  {loading ? "Blocking..." : "Block User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
