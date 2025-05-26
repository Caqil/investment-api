import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Setting } from "@/types/setting";

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);

  const fetchSettings = useCallback(async (group?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = group ? `/admin/settings?group=${group}` : '/admin/settings';
      const response = await api.settings.getAll(endpoint);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data?.settings) {
        setSettings(response.data.settings);
        
        // Extract unique groups
        const uniqueGroups = Array.from(
          new Set(response.data.settings.map((setting: Setting) => setting.group))
        );
        setGroups(uniqueGroups);
      }
    } catch (err) {
      setError("Failed to load settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (id: number, value: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const setting = settings.find(s => s.id === id);
      if (!setting) {
        return { success: false, error: "Setting not found" };
      }
      
      const response = await api.settings.update(id, {
        value,
        display_name: setting.display_name,
        description: setting.description,
        group: setting.group
      });
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      // Update the settings list
      setSettings(currentSettings => 
        currentSettings.map(s => 
          s.id === id ? { ...s, value } : s
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Failed to update setting" };
    }
  }, [settings]);

  const createSetting = useCallback(async (settingData: Partial<Setting>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.settings.create(settingData);
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      // Add the new setting to the list
      if (response.data?.setting) {
        setSettings(currentSettings => [...currentSettings, response.data.setting]);
        
        // Update groups if needed
        if (settingData.group && !groups.includes(settingData.group)) {
          setGroups(currentGroups => [...currentGroups, settingData.group]);
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Failed to create setting" };
    }
  }, [groups]);

  const deleteSetting = useCallback(async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.settings.delete(id);
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      // Remove the setting from the list
      setSettings(currentSettings => 
        currentSettings.filter(s => s.id !== id)
      );
      
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Failed to delete setting" };
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    groups,
    fetchSettings,
    updateSetting,
    createSetting,
    deleteSetting,
    getSettingsByGroup: useCallback((group: string) => {
      return settings.filter(setting => setting.group === group);
    }, [settings])
  };
}