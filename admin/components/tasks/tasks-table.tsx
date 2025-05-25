// src/components/tasks/tasks-table.tsx
import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { Edit2, Trash2, ExternalLink } from "lucide-react";
import { TaskFormDialog } from "./task-form";
import { Task, TaskType } from "../../types/task";

interface TasksTableProps {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  onUpdateTask: (
    id: number,
    taskData: {
      name: string;
      description: string;
      task_type: string;
      task_url: string;
      is_mandatory: boolean;
    }
  ) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
}

export function TasksTable({
  tasks,
  isLoading,
  error,
  onUpdateTask,
  onDeleteTask,
}: TasksTableProps) {
  // Format task type for display
  const formatTaskType = (type: TaskType) => {
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

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <div className="h-9 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-9 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-6"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : tasks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-6"
              >
                No tasks found. Create your first task to get started.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">{task.description}</div>
                </TableCell>
                <TableCell>{formatTaskType(task.task_type)}</TableCell>
                <TableCell>
                  {task.task_url ? (
                    <a
                      href={task.task_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline"
                    >
                      <span className="truncate max-w-[150px]">
                        {
                          task.task_url
                            .replace(/^https?:\/\//, "")
                            .split("/")[0]
                        }
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.is_mandatory ? (
                    <Badge>Mandatory</Badge>
                  ) : (
                    <Badge variant="outline">Optional</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TaskFormDialog
                      task={task}
                      onSubmit={(data) => onUpdateTask(task.id, data)}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      }
                    />

                    <DeleteTaskDialog
                      task={task}
                      onDelete={() => onDeleteTask(task.id)}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
