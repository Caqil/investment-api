"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Task, TaskType } from "@/types/task";

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const router = useRouter();
  const taskId = parseInt(params.id, 10);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate that the ID is a number
  useEffect(() => {
    if (isNaN(taskId)) {
      setError("Invalid task ID");
      setLoading(false);
      return;
    }

    const fetchTask = async () => {
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
  }, [taskId]);

  const handleBack = () => {
    router.push("/tasks");
  };

  const handleTaskUpdate = async (updatedTask: any) => {
    try {
      const response = await api.tasks.update(taskId, updatedTask);

      if (response.error) {
        throw new Error(response.error);
      }

      // Navigate back to the tasks list
      router.push("/tasks");
    } catch (err) {
      console.error("Error updating task:", err);
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {loading
            ? "Loading Task..."
            : task
            ? `Edit Task: ${task.name}`
            : "Task Not Found"}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {task && (
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

      {!loading && !task && !error && (
        <Alert>
          <AlertDescription>Task not found</AlertDescription>
        </Alert>
      )}
    </DashboardShell>
  );
}
