"use client";

import { Task, TaskType } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { truncateString } from "@/lib/utils";

interface TasksTableProps {
  tasks: Task[];
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function TasksTable({
  tasks,
  loading,
  onDelete,
  onEdit,
}: TasksTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      onDelete(taskToDelete.id);
    }
    setDeleteDialogOpen(false);
  };

  const getTaskTypeBadge = (type: TaskType) => {
    switch (type) {
      case TaskType.FOLLOW:
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 hover:bg-purple-100"
          >
            Follow
          </Badge>
        );
      case TaskType.LIKE:
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Like
        </Badge>;
      case TaskType.INSTALL:
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
          >
            Install
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="border rounded-md p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-sm  mt-1">
            There are no tasks matching your criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider"
                >
                  Mandatory
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium  uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    {task.name}
                  </td>
                  <td className="px-6 py-4 text-sm  max-w-xs">
                    {truncateString(task.description, 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    {getTaskTypeBadge(task.task_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    {task.is_mandatory ? (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Required
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 hover:bg-gray-100"
                      >
                        Optional
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {task.task_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(task.task_url, "_blank")}
                        className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(task.id)}
                      className="h-8 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(task)}
                      className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the task "{taskToDelete?.name}". This
              action cannot be undone.
              {taskToDelete?.is_mandatory && (
                <div className="mt-2 font-medium text-yellow-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  This is a mandatory task for withdrawals.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
