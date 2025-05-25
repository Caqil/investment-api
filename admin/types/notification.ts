
// src/types/notification.ts
export type NotificationType = 
  | 'withdrawal'
  | 'deposit'
  | 'bonus'
  | 'system';

export type Notification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationResponse = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
};
