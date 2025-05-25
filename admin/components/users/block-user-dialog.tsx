// src/components/users/block-user-dialog.tsx
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
import { User } from "../../types/user";

interface BlockUserDialogProps {
  user: User;
  onBlockStatusChange: (userId: number, isBlocked: boolean) => Promise<void>;
}

export function BlockUserDialog({
  user,
  onBlockStatusChange,
}: BlockUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);

    try {
      await onBlockStatusChange(user.id, user.is_blocked);
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating user block status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={user.is_blocked ? "default" : "destructive"} size="sm">
          {user.is_blocked ? "Unblock" : "Block"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user.is_blocked ? "Unblock User" : "Block User"}
          </DialogTitle>
          <DialogDescription>
            {user.is_blocked
              ? `Are you sure you want to unblock ${user.name}? This will allow them to access the platform again.`
              : `Are you sure you want to block ${user.name}? This will prevent them from accessing the platform.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={user.is_blocked ? "default" : "destructive"}
            onClick={handleAction}
            disabled={isLoading}
          >
            {isLoading
              ? user.is_blocked
                ? "Unblocking..."
                : "Blocking..."
              : user.is_blocked
              ? "Unblock"
              : "Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
