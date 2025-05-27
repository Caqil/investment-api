// investment-admin/components/settings/settings-help.tsx
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface SettingsHelpProps {
  settingKey: string;
}

export function SettingsHelp({ settingKey }: SettingsHelpProps) {
  const helpTexts: Record<string, string> = {
    enable_device_check:
      "When enabled, users can only register one account per device. When disabled, multiple accounts can be registered from the same device. This setting affects new registrations only.",
    maintenance_mode:
      "When enabled, the app will be inaccessible to regular users. Only admins can access the system during maintenance mode.",
    // Add more help texts for other settings as needed
  };

  const helpText = helpTexts[settingKey];

  if (!helpText) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{helpText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
