"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, RefreshCw, Search } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { SettingForm } from "@/components/settings/settings-form";
import { SettingsGroup } from "@/components/settings/settings-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Setting } from "@/types/setting";

const GROUP_DESCRIPTIONS: Record<string, string> = {
  general: "General application settings",
  bonus: "Settings related to user bonuses and rewards",
  payment: "Payment gateway and deposit settings",
  withdrawal: "User withdrawal settings",
  system: "System, security, and application behavior settings",
  contact: "Contact information settings",
  social: "Social media links",
};

export default function SettingsPage() {
  const {
    settings,
    groups,
    loading,
    error,
    fetchSettings,
    updateSetting,
    createSetting,
    deleteSetting,
    getSettingsByGroup,
  } = useSettings();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleCreateSetting = async (settingData: Partial<Setting>) => {
    setFormError(null);
    const { success, error } = await createSetting(settingData);

    if (!success && error) {
      setFormError(error);
      return false;
    }

    setIsCreateDialogOpen(false);
    return true;
  };

  // Filter settings based on search query
  const filteredSettings = settings.filter((setting) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      setting.key.toLowerCase().includes(query) ||
      setting.display_name.toLowerCase().includes(query) ||
      setting.value.toLowerCase().includes(query) ||
      setting.description?.toLowerCase().includes(query) ||
      setting.group.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <div className="flex gap-2">
          {/* <Button onClick={fetchSettings} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button> */}
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Setting
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search settings..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList>
          <TabsTrigger value="all">All Settings</TabsTrigger>
          {groups.map((group) => (
            <TabsTrigger key={group} value={group} className="capitalize">
              {group}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-[150px] w-full" />
              <Skeleton className="h-[150px] w-full" />
            </div>
          ) : (
            groups.map((group) => {
              const groupSettings = searchQuery
                ? filteredSettings.filter((setting) => setting.group === group)
                : getSettingsByGroup(group);

              // Skip empty groups when searching
              if (searchQuery && groupSettings.length === 0) {
                return null;
              }

              return (
                <SettingsGroup
                  key={group}
                  title={group}
                  description={GROUP_DESCRIPTIONS[group]}
                  settings={groupSettings}
                  loading={loading}
                  onUpdate={updateSetting}
                  onDelete={deleteSetting}
                />
              );
            })
          )}
        </TabsContent>

        {groups.map((group) => (
          <TabsContent key={group} value={group} className="mt-4">
            <SettingsGroup
              title={group}
              description={GROUP_DESCRIPTIONS[group]}
              settings={
                searchQuery
                  ? filteredSettings.filter(
                      (setting) => setting.group === group
                    )
                  : getSettingsByGroup(group)
              }
              loading={loading}
              onUpdate={updateSetting}
              onDelete={deleteSetting}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Setting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Setting</DialogTitle>
            <DialogDescription>
              Add a new configuration setting to the system.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
              {formError}
            </div>
          )}
          <SettingForm
            onSubmit={handleCreateSetting}
            onCancel={() => setIsCreateDialogOpen(false)}
            existingGroups={groups}
          />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
