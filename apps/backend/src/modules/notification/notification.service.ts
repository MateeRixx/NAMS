import prisma from '@newsflow/database';
import * as notificationRepository from './notification.repository.js';
import type { NotificationListResponse, NotificationResponse } from './notification.types.js';
import { sendEmail } from '../../services/email.service.js';

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

export async function sendNotification(dto: {
  agencyId: string;
  customerId?: string;
  channel: string;
  title: string;
  message: string;
}): Promise<NotificationResponse> {
  const notification = await notificationRepository.createNotification({
    agencyId: dto.agencyId,
    customerId: dto.customerId || undefined,
    type: 'MANUAL',
    channel: dto.channel,
    title: dto.title,
    message: dto.message,
    status: 'SENT',
  });

  if (dto.channel === 'EMAIL' && dto.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: dto.customerId, agencyId: dto.agencyId } });
    if (customer?.email) {
      await sendEmail({ to: customer.email, subject: dto.title, html: dto.message.replace(/\n/g, '<br/>') }).catch(() => {});
    }
  }

  return toResponse(notification);
}

