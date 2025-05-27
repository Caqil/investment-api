import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Setting, SettingType } from "@/types/setting";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Save,
  X,
  Trash2,
  Edit,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingsListProps {
  settings: Setting[];
  loading: boolean;
  onUpdate: (
    id: number,
    value: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export function SettingsList({
  settings,
  loading,
  onUpdate,
  onDelete,
}: SettingsListProps) {
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

  // Render value editor based on setting type
  const renderValueEditor = (setting: Setting) => {
    switch (setting.type) {
      case SettingType.BOOLEAN:
        return (
          <Switch
            checked={editValue === "true"}
            onCheckedChange={(checked) => {
              setEditValue(checked ? "true" : "false");
            }}
          />
        );

      case SettingType.NUMBER:
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full max-w-[200px]"
          />
        );

      default: // STRING
        return (
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full max-w-[200px]"
          />
        );
    }
  };

  // Format setting value based on its type
  const formatValue = (setting: Setting) => {
    switch (setting.type) {
      case SettingType.BOOLEAN:
        return <Switch disabled={true} checked={setting.value === "true"} />;

      case SettingType.NUMBER:
        return <span>{parseFloat(setting.value).toLocaleString()}</span>;

      default:
        return <span className="truncate max-w-[200px]">{setting.value}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No settings found in this group
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settings.map((setting) => (
        <Card
          key={setting.id}
          className={`p-4 transition-all ${
            editingId === setting.id ? "border-primary" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm">{setting.display_name}</h3>
                <Badge variant="outline" className="capitalize text-xs">
                  {setting.type}
                </Badge>
                {setting.description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px]">{setting.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {setting.key}
              </div>
              <div className="mt-2 flex items-center">
                <div className="font-medium text-xs text-muted-foreground mr-2">
                  Value:
                </div>
                {editingId === setting.id ? (
                  <div className="flex items-center space-x-2">
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
                  <div className="flex-1">{formatValue(setting)}</div>
                )}
              </div>
            </div>
            <div>
              {deleteConfirmId === setting.id ? (
                <div className="flex space-x-1">
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
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(setting)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
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
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
