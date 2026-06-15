export interface NotificationResponse {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
}
