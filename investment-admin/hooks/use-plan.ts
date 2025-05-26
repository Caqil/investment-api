"use client";

import { useState, useEffect } from "react";
import { Plan } from "@/types/plan";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      // Since the middleware still requires Device ID, we need to include it
      const token = getToken();
      const adminDeviceID = localStorage.getItem("admin_device_id") || "admin-device-123456789";
      localStorage.setItem("admin_device_id", adminDeviceID);
      
      const response = await fetch(`${API_BASE_URL}/plans`, {
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
      
      if (data && data.plans) {
        setPlans(data.plans);
      } else {
        console.warn("API response didn't include expected 'plans' property:", data);
        setPlans([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load plans";
      setError(message);
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  // For admin routes, we can use the API client as these endpoints
  // don't require device ID verification
  const createPlan = async (planData: Partial<Plan>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.plans.create(planData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh plans after successful creation
      await fetchPlans();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create plan";
      return { success: false, error: message };
    }
  };

  const updatePlan = async (id: number, planData: Partial<Plan>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.plans.update(id, planData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh plans after successful update
      await fetchPlans();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update plan";
      return { success: false, error: message };
    }
  };

  const deletePlan = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.plans.delete(id);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh plans after successful deletion
      await fetchPlans();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete plan";
      return { success: false, error: message };
    }
  };

  // Load plans on initial render
  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
}