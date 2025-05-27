"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Shield, Terminal } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const { settings, loading, error, fetchSettings, updateSetting } =
    useSettings();
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  // Filter system settings
  const systemSettings = settings.filter(
    (setting) => setting.group === "system"
  );

  // Find specific settings
  const deviceCheckSetting = systemSettings.find(
    (s) => s.key === "enable_device_check"
  );
  const maintenanceModeSetting = systemSettings.find(
    (s) => s.key === "maintenance_mode"
  );

  const handleToggle = async (id: number, key: string, checked: boolean) => {
    setUpdating((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await updateSetting(id, checked ? "true" : "false");

      if (result.success) {
        toast.success(`Setting updated successfully`);
      } else {
        toast.error(result.error || "Failed to update setting");
      }
    } catch (err) {
      toast.error("An error occurred while updating the setting");
      console.error(err);
    } finally {
      setUpdating((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <Button onClick={() => fetchSettings()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Security Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure application security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                {deviceCheckSetting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="device-check"
                          className="text-base font-medium"
                        >
                          Device Check
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          When enabled, users can only register one account per
                          device
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            deviceCheckSetting.value === "true"
                              ? "default"
                              : "outline"
                          }
                          className={
                            deviceCheckSetting.value === "true"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : ""
                          }
                        >
                          {deviceCheckSetting.value === "true"
                            ? "Enabled"
                            : "Disabled"}
                        </Badge>
                        <Switch
                          id="device-check"
                          checked={deviceCheckSetting.value === "true"}
                          onCheckedChange={(checked) =>
                            handleToggle(
                              deviceCheckSetting.id,
                              deviceCheckSetting.key,
                              checked
                            )
                          }
                          disabled={updating[deviceCheckSetting.key]}
                        />
                      </div>
                    </div>
                    {deviceCheckSetting.value !== "true" && (
                      <div className="flex items-start mt-2 p-2 bg-amber-50 border border-amber-100 rounded-md">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                          Device check is disabled. Users can register multiple
                          accounts from the same device.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* System Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2 h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Configure application operational status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                {maintenanceModeSetting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="maintenance-mode"
                          className="text-base font-medium"
                        >
                          Maintenance Mode
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          When enabled, the application will be inaccessible to
                          users
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            maintenanceModeSetting.value === "true"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {maintenanceModeSetting.value === "true"
                            ? "Enabled"
                            : "Disabled"}
                        </Badge>
                        <Switch
                          id="maintenance-mode"
                          checked={maintenanceModeSetting.value === "true"}
                          onCheckedChange={(checked) =>
                            handleToggle(
                              maintenanceModeSetting.id,
                              maintenanceModeSetting.key,
                              checked
                            )
                          }
                          disabled={updating[maintenanceModeSetting.key]}
                        />
                      </div>
                    </div>
                    {maintenanceModeSetting.value === "true" && (
                      <div className="flex items-start mt-2 p-2 bg-amber-50 border border-amber-100 rounded-md">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                          Maintenance mode is currently active. Only
                          administrators can access the system.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Other System Settings Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Other System Settings</CardTitle>
          <CardDescription>
            Additional system configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              systemSettings
                .filter(
                  (s) =>
                    s.key !== "enable_device_check" &&
                    s.key !== "maintenance_mode"
                )
                .map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-start space-x-4 py-3 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{setting.display_name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {setting.description}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {setting.type === "boolean" ? (
                        <Switch
                          checked={setting.value === "true"}
                          onCheckedChange={(checked) =>
                            handleToggle(setting.id, setting.key, checked)
                          }
                          disabled={updating[setting.key]}
                        />
                      ) : (
                        <div className="text-sm font-medium">
                          {setting.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
