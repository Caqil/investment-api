import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Save, X, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Setting, SettingType } from "@/types/setting";
import { toast } from "sonner";
import { SettingsHelp } from "./settings-help";

interface SettingsTableProps {
  settings: Setting[];
  loading: boolean;
  onUpdate: (
    id: number,
    value: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export function SettingsTable({
  settings,
  loading,
  onUpdate,
  onDelete,
}: SettingsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Start editing a setting
  const handleEdit = (setting: Setting) => {
    setEditingId(setting.id);
    setEditValue(setting.value);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  // Save changes
  const handleSave = async (id: number) => {
    const result = await onUpdate(id, editValue);

    if (result.success) {
      toast("The setting has been updated successfully.");
      setEditingId(null);
    } else {
      toast(result.error || "Failed to update setting");
    }
  };

  // Confirm deletion
  const handleConfirmDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Delete setting
  const handleDelete = async (id: number) => {
    const result = await onDelete(id);

    if (result.success) {
      toast("The setting has been deleted successfully.");
      setDeleteConfirmId(null);
    } else {
      toast(result.error || "Failed to delete setting");
    }
  };

  const renderValueEditor = (setting: Setting) => {
    switch (setting.type) {
      case SettingType.BOOLEAN:
        return (
          <div className="flex items-center">
            <Checkbox
              checked={editValue === "true"}
              onCheckedChange={(checked) => {
                setEditValue(checked ? "true" : "false");
              }}
            />
            <span className="ml-2">
              {editValue === "true" ? "Enabled" : "Disabled"}
            </span>
          </div>
        );

      case SettingType.NUMBER:
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full"
          />
        );

      default: // STRING
        return (
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full"
          />
        );
    }
  };
  const formatValue = (setting: Setting) => {
    switch (setting.type) {
      case SettingType.BOOLEAN:
        return setting.value === "true" ? (
          <Badge
            className="bg-green-100 text-green-800 hover:bg-green-200"
            variant="outline"
          >
            Enabled
          </Badge>
        ) : (
          <Badge
            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
            variant="outline"
          >
            Disabled
          </Badge>
        );

      case SettingType.NUMBER:
        return parseFloat(setting.value).toLocaleString();

      default:
        return setting.value;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Setting</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[180px]">Group</TableHead>
            <TableHead className="w-[150px]">Type</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No settings found
              </TableCell>
            </TableRow>
          ) : (
            settings.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-medium">
                  <div className="font-medium flex items-center">
                    {setting.display_name}
                    <SettingsHelp settingKey={setting.key} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {setting.key}
                  </div>
                  {setting.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {setting.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === setting.id ? (
                    <div className="flex space-x-2">
                      {renderValueEditor(setting)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(setting.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    formatValue(setting)
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {setting.group}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {setting.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {deleteConfirmId === setting.id ? (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(setting.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelDelete}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(setting)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleConfirmDelete(setting.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
