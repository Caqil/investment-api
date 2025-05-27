import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SettingsList } from "./settings-list";
import { Setting } from "@/types/setting";

interface SettingsGroupProps {
  title: string;
  description?: string;
  settings: Setting[];
  loading: boolean;
  onUpdate: (
    id: number,
    value: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export function SettingsGroup({
  title,
  description,
  settings,
  loading,
  onUpdate,
  onDelete,
}: SettingsGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl capitalize">{title}</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <SettingsList
              settings={settings}
              loading={loading}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
