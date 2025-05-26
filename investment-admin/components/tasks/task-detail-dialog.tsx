"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/tasks/task-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { Task, TaskType } from "@/types/task";
import { Loader2 } from "lucide-react";

interface TaskDetailDialogProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export function TaskDetailDialog({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when dialog opens/closes
    if (!open) {
      setTask(null);
      setError(null);
      return;
    }

    // Skip fetching if no taskId is provided
    if (taskId === null) {
      return;
    }

    const fetchTask = async () => {
      setLoading(true);
      setError(null);

      try {
        // In a real application, you'd have an API endpoint to get a task by ID
        // For now, we'll fetch all tasks and find the one with the matching ID
        const response = await api.tasks.getAll();

        if (response.error) {
          throw new Error(response.error);
        }

        const tasks = response.data?.tasks || [];
        const foundTask = tasks.find((t) => t.id === taskId);

        if (!foundTask) {
          throw new Error("Task not found");
        }

        setTask(foundTask);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, open]);

  const handleTaskUpdate = async (updatedTask: any) => {
    setLoading(true);
    setError(null);

    try {
      if (!taskId) {
        throw new Error("Task ID is missing");
      }

      const response = await api.tasks.update(taskId, updatedTask);

      if (response.error) {
        throw new Error(response.error);
      }

      // Close the dialog and notify parent
      onOpenChange(false);
      onTaskUpdated();
    } catch (err) {
      console.error("Error updating task:", err);
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle = loading
    ? "Loading Task..."
    : task
    ? `Edit Task: ${task.name}`
    : "Task Not Found";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>View and edit task details.</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {task && !loading && (
          <TaskForm
            initialValues={{
              name: task.name,
              description: task.description,
              task_type: task.task_type,
              task_url: task.task_url || "",
              is_mandatory: task.is_mandatory,
            }}
            onSubmit={handleTaskUpdate}
            isLoading={loading}
            isEditMode={true}
          />
        )}

        {!loading && !task && !error && taskId !== null && (
          <Alert>
            <AlertDescription>Task not found</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
