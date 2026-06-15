import prisma from '@newsflow/database';
import { getQueue } from '../config/queue.js';
import { sendEmail, isEmailConfigured } from './email.service.js';
import { renderEmailTemplate } from './template.service.js';

type NotificationType =
  | 'INVOICE_GENERATED'
  | 'PAYMENT_RECEIVED'
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_RESOLVED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_PAUSED'
  | 'SUBSCRIPTION_RESUMED'
  | 'WELCOME';

type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'PUSH';

interface NotificationPayload {
  agencyId: string;
  customerId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  emailTo?: string;
  emailSubject?: string;
  emailHtml?: string;
  templateData?: Record<string, string>;
}

const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  INVOICE_GENERATED: 'New Invoice Generated',
  PAYMENT_RECEIVED: 'Payment Received',
  COMPLAINT_CREATED: 'Complaint Registered',
  COMPLAINT_RESOLVED: 'Complaint Resolved',
  SUBSCRIPTION_CREATED: 'Subscription Started',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_PAUSED: 'Subscription Paused',
  SUBSCRIPTION_RESUMED: 'Subscription Resumed',
  WELCOME: 'Welcome to NewsFlow',
};

export async function createAndQueueNotification(payload: NotificationPayload): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: {
        agencyId: payload.agencyId,
        customerId: payload.customerId ?? null,
        type: payload.type,
        channel: payload.channel,
        title: payload.title || NOTIFICATION_TITLES[payload.type],
        message: payload.message,
        status: 'PENDING',
      },
    });

    const queue = getQueue('notifications');
    await queue.add(
      `notify:${payload.channel}:${payload.type}`,
      {
        notificationId: notification.id,
        ...payload,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error);
  }
}

export async function sendEmailNotification(
  notificationId: string,
  payload: {
    emailTo?: string;
    emailSubject?: string;
    type: NotificationType;
    templateData?: Record<string, string>;
    title: string;
    message: string;
  }
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn('[NotificationService] Email not configured, marking as sent anyway');
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() },
    });
    return true;
  }

  if (!payload.emailTo) {
    console.warn('[NotificationService] No email recipient for notification', notificationId);
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'FAILED' },
    });
    return false;
  }

  const html = payload.emailSubject
    ? renderEmailTemplate(payload.type, {
        title: payload.title,
        message: payload.message,
        ...payload.templateData,
      })
    : undefined;

  const result = await sendEmail({
    to: payload.emailTo,
    subject: payload.emailSubject ?? payload.title,
    html: html ?? payload.message,
  });

  if (result) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date() },
    });
    return true;
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: 'FAILED' },
  });
  return false;
}

export async function listNotifications(
  agencyId: string,
  customerId?: string,
  options?: { limit?: number; offset?: number }
) {
  const where: Record<string, unknown> = { agencyId };
  if (customerId) where['customerId'] = customerId;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.notification.count({ where: where as never }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      channel: n.channel,
      title: n.title,
      message: n.message,
      status: n.status,
      sentAt: n.sentAt,
      createdAt: n.createdAt,
    })),
    total,
  };
}

export async function getUnreadCount(agencyId: string, customerId?: string): Promise<number> {
  const where: Record<string, unknown> = { agencyId, status: 'PENDING' };
  if (customerId) where['customerId'] = customerId;
  return prisma.notification.count({ where: where as never });
}
