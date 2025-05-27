// investment-admin/components/dashboard/security-settings.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, Users } from "lucide-react";
import { Setting, SettingType } from "@/types/setting";
import { Skeleton } from "@/components/ui/skeleton";

interface SecuritySettingsProps {
  settings: Setting[];
  loading: boolean;
  onUpdate: (
    id: number,
    value: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function SecuritySettings({
  settings,
  loading,
  onUpdate,
}: SecuritySettingsProps) {
  const findSetting = (key: string) => settings.find((s) => s.key === key);

  const deviceCheckSetting = findSetting("enable_device_check");
  const maintenanceModeSetting = findSetting("maintenance_mode");

  const handleToggle = async (
    setting: Setting | undefined,
    checked: boolean
  ) => {
    if (!setting) return;
    await onUpdate(setting.id, checked ? "true" : "false");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Configure security and system behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Configure security and system behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {deviceCheckSetting && (
          <div className="flex items-start space-x-4">
            <Users className="h-5 w-5 mt-0.5 text-blue-500" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="device-check" className="font-medium">
                  {deviceCheckSetting.display_name}
                </Label>
                <Switch
                  id="device-check"
                  checked={deviceCheckSetting.value === "true"}
                  onCheckedChange={(checked) =>
                    handleToggle(deviceCheckSetting, checked)
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {deviceCheckSetting.description ||
                  "When enabled, users can only register one account per device. When disabled, multiple accounts can be registered from the same device."}
              </p>
            </div>
          </div>
        )}

        {maintenanceModeSetting && (
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-500" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-mode" className="font-medium">
                  {maintenanceModeSetting.display_name}
                </Label>
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceModeSetting.value === "true"}
                  onCheckedChange={(checked) =>
                    handleToggle(maintenanceModeSetting, checked)
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {maintenanceModeSetting.description ||
                  "When enabled, the app will be inaccessible to regular users. Only admins can access the system."}
              </p>
            </div>
          </div>
        )}

        {/* You can add more security settings here */}
      </CardContent>
    </Card>
  );
}
