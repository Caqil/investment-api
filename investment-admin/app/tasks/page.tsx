"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Task, TaskType } from "@/types/task";
import { AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { TaskStats } from "@/components/tasks/task-stats";
import { TasksTable } from "@/components/tasks/tasks-table";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [mandatoryFilter, setMandatoryFilter] = useState<string>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    mandatoryTasks: 0,
    followTasks: 0,
    likeTasks: 0,
    installTasks: 0,
  });

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.tasks.getAll();

      if (response.error) {
        throw new Error(response.error);
      }

      const fetchedTasks = response.data?.tasks || [];
      setTasks(fetchedTasks);

      // Calculate stats
      const mandatoryTasks = fetchedTasks.filter((t) => t.is_mandatory).length;
      const followTasks = fetchedTasks.filter(
        (t) => t.task_type === TaskType.FOLLOW
      ).length;
      const likeTasks = fetchedTasks.filter(
        (t) => t.task_type === TaskType.LIKE
      ).length;
      const installTasks = fetchedTasks.filter(
        (t) => t.task_type === TaskType.INSTALL
      ).length;

      setStats({
        totalTasks: fetchedTasks.length,
        mandatoryTasks,
        followTasks,
        likeTasks,
        installTasks,
      });
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...tasks];

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter((task) => task.task_type === typeFilter);
    }

    // Apply mandatory filter
    if (mandatoryFilter !== "all") {
      const isMandatory = mandatoryFilter === "mandatory";
      result = result.filter((task) => task.is_mandatory === isMandatory);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.id.toString().includes(query)
      );
    }

    setFilteredTasks(result);
  }, [tasks, typeFilter, mandatoryFilter, searchQuery]);

  const handleTaskCreated = () => {
    setCreateDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTaskDelete = async (id: number) => {
    try {
      const response = await api.tasks.delete(id);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh the task list
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleTaskEdit = (id: number) => {
    router.push(`/tasks/${id}`);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Task Statistics */}
      <TaskStats stats={stats} loading={loading} />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={loading}
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={TaskType.FOLLOW}>Follow</SelectItem>
              <SelectItem value={TaskType.LIKE}>Like</SelectItem>
              <SelectItem value={TaskType.INSTALL}>Install</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={mandatoryFilter}
            onValueChange={setMandatoryFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Required Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="mandatory">Mandatory Only</SelectItem>
              <SelectItem value="optional">Optional Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      <TasksTable
        tasks={filteredTasks}
        loading={loading}
        onDelete={handleTaskDelete}
        onEdit={handleTaskEdit}
      />

      {filteredTasks.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No tasks found</CardTitle>
            <CardDescription>
              {searchQuery || typeFilter !== "all" || mandatoryFilter !== "all"
                ? "Try adjusting your filters"
                : "There are no tasks defined in the system. Create your first task."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={handleTaskCreated}
      />
    </DashboardShell>
  );
}
