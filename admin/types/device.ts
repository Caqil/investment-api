// src/types/device.ts
export type Device = {
    id: number;
    user_id: number;
    device_id: string;
    device_name?: string;
    device_model?: string;
    last_login?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  
  export type DeviceResponse = {
    id: number;
    device_id: string;
    device_name?: string;
    device_model?: string;
    last_login?: string;
    is_active: boolean;
    created_at: string;
  };