"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TaskForm } from "./task-form";
import { TaskType } from "@/types/task";
import { api } from "@/lib/api";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: {
    name: string;
    description: string;
    task_type: TaskType;
    task_url: string;
    is_mandatory: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.tasks.create(values);

      if (response.error) {
        throw new Error(response.error);
      }

      onTaskCreated();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task for users to complete before making withdrawals.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TaskForm
          initialValues={{
            name: "",
            description: "",
            task_type: TaskType.FOLLOW,
            task_url: "",
            is_mandatory: false,
          }}
          onSubmit={handleSubmit}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
