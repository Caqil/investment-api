"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userApi } from "@/lib/user-api";
import { Task, TaskType } from "@/types/task";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  CheckSquare,
  XSquare,
  Instagram,
  Heart,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mandatoryTasks, setMandatoryTasks] = useState<Task[]>([]);
  const [optionalTasks, setOptionalTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  // Task completion stats
  const [completionStats, setCompletionStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    mandatoryTasks: 0,
    completedMandatoryTasks: 0,
    completionRate: 0,
    mandatoryCompletionRate: 0,
    allMandatoryCompleted: false,
  });

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await userApi.tasks.getAll();

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          const allTasks = response.data.tasks;
          setTasks(allTasks);

          // Separate mandatory and optional tasks
          const mandatory = allTasks.filter((task) => task.is_mandatory);
          const optional = allTasks.filter((task) => !task.is_mandatory);
          setMandatoryTasks(mandatory);
          setOptionalTasks(optional);

          // Calculate completion stats
          const totalTasks = allTasks.length;
          const completedTasks = allTasks.filter(
            (task) => task.is_completed
          ).length;
          const mandatoryTasks = mandatory.length;
          const completedMandatoryTasks = mandatory.filter(
            (task) => task.is_completed
          ).length;

          const completionRate =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;
          const mandatoryCompletionRate =
            mandatoryTasks > 0
              ? Math.round((completedMandatoryTasks / mandatoryTasks) * 100)
              : 0;
          const allMandatoryCompleted =
            mandatoryTasks > 0 && completedMandatoryTasks === mandatoryTasks;

          setCompletionStats({
            totalTasks,
            completedTasks,
            mandatoryTasks,
            completedMandatoryTasks,
            completionRate,
            mandatoryCompletionRate,
            allMandatoryCompleted,
          });
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Complete a task
  const completeTask = async (taskId: number) => {
    setCompletingTaskId(taskId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userApi.tasks.complete(taskId);

      if (response.error) {
        throw new Error(response.error);
      }

      // Update task status in state
      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, is_completed: true } : task
      );
      setTasks(updatedTasks);

      // Update mandatory and optional tasks
      const updatedMandatory = mandatoryTasks.map((task) =>
        task.id === taskId ? { ...task, is_completed: true } : task
      );
      setMandatoryTasks(updatedMandatory);

      const updatedOptional = optionalTasks.map((task) =>
        task.id === taskId ? { ...task, is_completed: true } : task
      );
      setOptionalTasks(updatedOptional);

      // Update completion stats
      const totalTasks = updatedTasks.length;
      const completedTasks = updatedTasks.filter(
        (task) => task.is_completed
      ).length;
      const mandatoryTasksCount = updatedMandatory.length;
      const completedMandatoryTasks = updatedMandatory.filter(
        (task) => task.is_completed
      ).length;

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const mandatoryCompletionRate =
        mandatoryTasksCount > 0
          ? Math.round((completedMandatoryTasks / mandatoryTasksCount) * 100)
          : 0;
      const allMandatoryCompleted =
        mandatoryTasksCount > 0 &&
        completedMandatoryTasks === mandatoryTasksCount;

      setCompletionStats({
        totalTasks,
        completedTasks,
        mandatoryTasks: mandatoryTasksCount,
        completedMandatoryTasks,
        completionRate,
        mandatoryCompletionRate,
        allMandatoryCompleted,
      });

      setSuccessMessage("Task completed successfully!");

      // Check if all mandatory tasks are completed
      if (response.data?.all_mandatory_completed) {
        setSuccessMessage(
          "Congratulations! You've completed all required tasks. You can now request withdrawals."
        );
      }
    } catch (err) {
      console.error("Error completing task:", err);
      setError(err instanceof Error ? err.message : "Failed to complete task");
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Get task type icon
  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.FOLLOW:
        return <Instagram className="h-4 w-4" />;
      case TaskType.LIKE:
        return <Heart className="h-4 w-4" />;
      case TaskType.INSTALL:
        return <Download className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  // Render task item
  const renderTaskItem = (task: Task) => {
    const isCompleting = completingTaskId === task.id;

    return (
      <div
        key={task.id}
        className="border rounded-lg p-4 transition-all hover:shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              task.is_completed
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {task.is_completed ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              getTaskTypeIcon(task.task_type)
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{task.name}</h3>
                {task.is_mandatory && (
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800"
                  >
                    Required
                  </Badge>
                )}
              </div>

              {task.is_completed ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {task.description}
            </p>

            <div className="flex items-center justify-between mt-4">
              {task.task_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(task.task_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </Button>
              )}

              {!task.is_completed && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => completeTask(task.id)}
                  disabled={isCompleting}
                  className="ml-auto"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          Complete tasks to unlock withdrawals and earn bonuses
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Task Completion Progress</CardTitle>
          <CardDescription>
            Track your progress in completing required and optional tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Required Tasks</span>
                  <span>
                    {completionStats.completedMandatoryTasks}/
                    {completionStats.mandatoryTasks} (
                    {completionStats.mandatoryCompletionRate}%)
                  </span>
                </div>
                <Progress
                  value={completionStats.mandatoryCompletionRate}
                  className="h-2"
                />
                {completionStats.allMandatoryCompleted ? (
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>All required tasks completed!</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-amber-600 mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>
                      Complete all required tasks to enable withdrawals
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>All Tasks</span>
                  <span>
                    {completionStats.completedTasks}/
                    {completionStats.totalTasks} (
                    {completionStats.completionRate}%)
                  </span>
                </div>
                <Progress
                  value={completionStats.completionRate}
                  className="h-2"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="required" className="space-y-6">
        <TabsList>
          <TabsTrigger value="required">
            <AlertCircle className="h-4 w-4 mr-2" />
            Required Tasks
          </TabsTrigger>
          <TabsTrigger value="optional">
            <CheckSquare className="h-4 w-4 mr-2" />
            Optional Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="required">
          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                      <div className="h-9 w-28 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : mandatoryTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CheckSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  No required tasks found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are currently no mandatory tasks to complete.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {mandatoryTasks.map(renderTaskItem)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optional">
          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                      <div className="h-9 w-28 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : optionalTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CheckSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  No optional tasks found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are currently no optional tasks to complete.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {optionalTasks.map(renderTaskItem)}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Task Completion Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Why Complete Tasks?</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Required tasks must be completed to enable withdrawals</li>
              <li>
                Completing tasks helps verify your account and prevent abuse
              </li>
              <li>Some tasks may offer additional bonuses or rewards</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">How to Complete Tasks</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>
                Click on the "Open Link" button to go to the required website
              </li>
              <li>Follow the instructions in the task description</li>
              <li>Come back to this page and click "Mark as Completed"</li>
              <li>Our system will verify your completion</li>
            </ol>
          </div>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              Complete all required tasks as soon as possible to unlock
              withdrawals.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
