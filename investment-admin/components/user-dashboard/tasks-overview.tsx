"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";
import { Task } from "@/types/task";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface TasksOverviewProps {
  tasks: Task[];
  isLoading: boolean;
  limit?: number;
}

export function TasksOverview({
  tasks,
  isLoading,
  limit = 3,
}: TasksOverviewProps) {
  const router = useRouter();

  // Calculate completion rate
  const completedTasks = tasks.filter((task) => task.is_completed).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Only show mandatory tasks in the overview
  const mandatoryTasks = tasks.filter((task) => task.is_mandatory);
  const limitedTasks = mandatoryTasks.slice(0, limit);

  // Check if all mandatory tasks are completed
  const allMandatoryCompleted =
    mandatoryTasks.length > 0 &&
    mandatoryTasks.every((task) => task.is_completed);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Required Tasks</CardTitle>
            <CardDescription>
              Complete these tasks to enable withdrawals
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1",
              allMandatoryCompleted
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            )}
          >
            {allMandatoryCompleted ? "Completed" : "Incomplete"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-6 w-6 rounded-full bg-muted animate-pulse"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : mandatoryTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No mandatory tasks found.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Task completion progress
                </span>
                <span className="text-sm font-medium">
                  {completedTasks}/{totalTasks} ({completionRate}%)
                </span>
              </div>
              <Progress value={completionRate} />
            </div>

            <div className="space-y-4 mb-4">
              {limitedTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-4">
                  {task.is_completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/user/tasks")}
            >
              {allMandatoryCompleted
                ? "View All Tasks"
                : "Complete Required Tasks"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
