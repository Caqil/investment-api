"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { tasksApi } from "@/lib/api";
import { Task } from "@/types/task";
import { useToast } from "@/components/ui/use-toast";
import { PlusIcon } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await tasksApi.getAll();
        setTasks(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to load tasks data");
        toast({
          title: "Error",
          description: "Failed to load tasks data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [toast]);

  // Handle task creation
  const handleCreateTask = async (taskData: {
    name: string;
    description: string;
    task_type: string;
    task_url: string;
    is_mandatory: boolean;
  }) => {
    try {
      const newTask = await tasksApi.create(taskData);
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setShowCreateForm(false);

      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  // Handle task update
  const handleUpdateTask = async (
    id: number,
    taskData: {
      name: string;
      description: string;
      task_type: string;
      task_url: string;
      is_mandatory: boolean;
    }
  ) => {
    try {
      const updatedTask = await tasksApi.update(id, taskData);

      // Update tasks list
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updatedTask : task))
      );

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id: number) => {
    try {
      await tasksApi.delete(id);

      // Remove task from list
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // Count mandatory tasks
  const mandatoryTaskCount = tasks.filter((task) => task.is_mandatory).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Tasks</h2>
          <p className="text-muted-foreground">
            Manage tasks that users must complete
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>

      {/* Create Task Form Dialog */}
      <TaskFormDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateTask}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CardDescription>Available user tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Mandatory Tasks
            </CardTitle>
            <CardDescription>Required for withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mandatoryTaskCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Optional Tasks
            </CardTitle>
            <CardDescription>Not required but recommended</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.length - mandatoryTaskCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <TasksTable
        tasks={tasks}
        isLoading={isLoading}
        error={error}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
