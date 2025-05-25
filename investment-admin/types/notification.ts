export enum NotificationType {
    WITHDRAWAL = "withdrawal",
    DEPOSIT = "deposit",
    BONUS = "bonus",
    SYSTEM = "system"
  }
  
  export interface Notification {
    id: number;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string;
  }