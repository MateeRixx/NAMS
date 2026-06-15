import * as notificationRepository from './notification.repository.js';
import type { NotificationListResponse, NotificationResponse } from './notification.types.js';

function toResponse(n: {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}): NotificationResponse {
  return {
    id: n.id,
    type: n.type,
    channel: n.channel,
    title: n.title,
    message: n.message,
    status: n.status,
    sentAt: n.sentAt,
    createdAt: n.createdAt,
  };
}

export async function listNotifications(
  agencyId: string,
  customerId?: string
): Promise<NotificationListResponse> {
  const { notifications, total } = await notificationRepository.listNotifications(
    agencyId,
    customerId
  );
  return {
    notifications: notifications.map(toResponse),
    total,
  };
}

export async function getUnreadCount(
  agencyId: string,
  customerId?: string
): Promise<{ count: number }> {
  const count = await notificationRepository.countUnread(agencyId, customerId);
  return { count };
}
