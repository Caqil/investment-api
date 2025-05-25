// components/user/task-list.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { userApi } from "@/lib/user-api";
import { toast } from "sonner";

interface Task {
  id: number;
  name: string;
  description: string;
  task_type: string;
  task_url?: string;
  is_mandatory: boolean;
  is_completed: boolean;
}

interface UserTaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onComplete?: (taskId: number) => void;
}

export function UserTaskList({
  tasks,
  isLoading,
  onComplete,
}: UserTaskListProps) {
  const [loading, setLoading] = useState<number | null>(null);

  // Complete task handler
  const handleCompleteTask = async (taskId: number) => {
    setLoading(taskId);
    try {
      await userApi.completeTask(taskId);
      toast.success("Task completed successfully");
      if (onComplete) {
        onComplete(taskId);
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    } finally {
      setLoading(null);
    }
  };

  // Get task type badge variant
  const getTaskTypeVariant = (type: string) => {
    switch (type) {
      case "follow":
        return "default";
      case "like":
        return "secondary";
      case "install":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get task type display name
  const getTaskTypeDisplay = (type: string) => {
    switch (type) {
      case "follow":
        return "Follow";
      case "like":
        return "Like";
      case "install":
        return "Install";
      default:
        return type;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex justify-between items-start pb-4 border-b last:border-b-0 last:pb-0"
          >
            <div className="space-y-1">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex justify-between items-start pb-4 border-b last:border-b-0 last:pb-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{task.name}</h4>
              {task.is_mandatory && <Badge variant="outline">Required</Badge>}
              <Badge variant={getTaskTypeVariant(task.task_type)}>
                {getTaskTypeDisplay(task.task_type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          {task.is_completed ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 mr-1" />
              <span>Completed</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => handleCompleteTask(task.id)}
              disabled={loading === task.id}
              variant={task.task_url ? "outline" : "default"}
            >
              {loading === task.id ? (
                "Completing..."
              ) : task.task_url ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <a
                    href={task.task_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Go to Task
                  </a>
                </>
              ) : (
                "Complete Task"
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
