"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskType } from "@/types/task";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TaskFormValues {
  name: string;
  description: string;
  task_type: TaskType;
  task_url: string;
  is_mandatory: boolean;
}

interface TaskFormProps {
  initialValues: TaskFormValues;
  onSubmit: (values: TaskFormValues) => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function TaskForm({
  initialValues,
  onSubmit,
  isLoading = false,
  isEditMode = false,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TaskFormValues, string>>
  >({});

  const handleChange = (field: keyof TaskFormValues, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormValues, string>> = {};

    if (!values.name.trim()) {
      newErrors.name = "Task name is required";
    }

    if (!values.description.trim()) {
      newErrors.description = "Task description is required";
    }

    if (!values.task_type) {
      newErrors.task_type = "Task type is required";
    }

    if (
      values.task_url.trim() &&
      !values.task_url.startsWith("http://") &&
      !values.task_url.startsWith("https://")
    ) {
      newErrors.task_url = "URL must start with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(values);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Task Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter task name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_type">
                Task Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={values.task_type}
                onValueChange={(value) => handleChange("task_type", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="task_type">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskType.FOLLOW}>Follow</SelectItem>
                  <SelectItem value={TaskType.LIKE}>Like</SelectItem>
                  <SelectItem value={TaskType.INSTALL}>Install</SelectItem>
                </SelectContent>
              </Select>
              {errors.task_type && (
                <p className="text-sm text-red-500">{errors.task_type}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter task description"
              rows={4}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task_url">Task URL</Label>
            <Input
              id="task_url"
              value={values.task_url}
              onChange={(e) => handleChange("task_url", e.target.value)}
              placeholder="https://example.com/task"
              disabled={isLoading}
            />
            {errors.task_url && (
              <p className="text-sm text-red-500">{errors.task_url}</p>
            )}
            <p className="text-sm text-gray-500">
              The URL where users can complete this task (e.g., social media
              page)
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_mandatory"
              checked={values.is_mandatory}
              onCheckedChange={(checked) =>
                handleChange("is_mandatory", checked === true)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="is_mandatory"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              This task is mandatory for withdrawals
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
