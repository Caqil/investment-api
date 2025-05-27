"use client";

import { useState, useEffect, useCallback } from "react";
import { Setting } from "@/types/setting";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async (group?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Since the middleware still requires Device ID, we need to include it
      const token = getToken();
      const adminDeviceID = localStorage.getItem("admin_device_id") || "admin-device-123456789";
      localStorage.setItem("admin_device_id", adminDeviceID);
      
      const endpoint = group ? `/admin/settings?group=${group}` : '/admin/settings';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Device-ID': adminDeviceID,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.settings) {
        setSettings(data.settings);
      } else {
        console.warn("API response didn't include expected 'settings' property:", data);
        setSettings([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load settings";
      setError(message);
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // For admin routes, we can use the API client as these endpoints
  // don't require device ID verification
  const updateSetting = async (id: number, value: string): Promise<{ success: boolean; error?: string }> => {
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
        throw new Error(response.error);
      }

      // Update the setting in the local state
      setSettings(currentSettings => 
        currentSettings.map(s => 
          s.id === id ? { ...s, value } : s
        )
      );
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update setting";
      return { success: false, error: message };
    }
  };

  const createSetting = async (settingData: Partial<Setting>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.settings.create(settingData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh settings after successful creation
      await fetchSettings();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create setting";
      return { success: false, error: message };
    }
  };

  const deleteSetting = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.settings.delete(id);

      if (response.error) {
        throw new Error(response.error);
      }

      // Remove the setting from the local state
      setSettings(currentSettings => 
        currentSettings.filter(s => s.id !== id)
      );
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete setting";
      return { success: false, error: message };
    }
  };

  // Get settings by group
  const getSettingsByGroup = useCallback((group: string): Setting[] => {
    return settings.filter(setting => setting.group === group);
  }, [settings]);

  // Calculate all unique groups
  const groups = useCallback(() => {
    return [...new Set(settings.map(setting => setting.group))];
  }, [settings]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    groups: groups(),
    fetchSettings,
    updateSetting,
    createSetting,
    deleteSetting,
    getSettingsByGroup
  };
}