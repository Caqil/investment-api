export enum NotificationType {
  WITHDRAWAL = "withdrawal",
  DEPOSIT = "deposit",
  BONUS = "bonus",
  SYSTEM = "system"
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  withdrawal_count: number;
  deposit_count: number;
  bonus_count: number;
  system_count: number;
  recent_notifications: Notification[];
}