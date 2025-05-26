"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task, TaskType } from "@/types/task";
import { formatDate } from "@/lib/utils";
import { Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteTaskDialog } from "./delete-task-dialog";

interface TasksTableProps {
  tasks: Task[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export function TasksTable({
  tasks,
  loading,
  onEdit,
  onDelete,
}: TasksTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  const getTaskTypeLabel = (type: TaskType) => {
    switch (type) {
      case TaskType.FOLLOW:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Follow
          </Badge>
        );
      case TaskType.LIKE:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Like
          </Badge>
        );
      case TaskType.INSTALL:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Install
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            {type}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-20 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell>
                    <span className="font-medium">{task.name}</span>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  </TableCell>
                  <TableCell>{getTaskTypeLabel(task.task_type)}</TableCell>
                  <TableCell>
                    {task.task_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a
                          href={task.task_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Open URL</span>
                        </a>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {task.is_mandatory ? (
                      <Badge className="bg-red-50 text-red-700 hover:bg-red-50">
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.created_at ? formatDate(task.created_at) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(task.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(task)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        taskId={selectedTask?.id ?? null}
        taskName={selectedTask?.name ?? ""}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={onDelete}
      />
    </>
  );
}
