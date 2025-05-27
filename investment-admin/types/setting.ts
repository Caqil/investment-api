export enum SettingType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean"
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: SettingType;
  display_name: string;
  description: string;
  group: string;
  updated_at: string;
}

export interface AppSettings {
  daily_bonus_percentage: number;
  referral_bonus_amount: number;
  referral_profit_percentage: number;
  minimum_withdrawal_amount: number;
  usd_to_bdt_conversion_rate: number;
  site_name: string;
  site_logo_url: string;
  maintenance_mode: boolean;
  enable_withdrawals: boolean;
  enable_deposits: boolean;
  enable_device_check: boolean;
}