import webpush from 'web-push';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import prisma from '@newsflow/database';
import { config } from '../config/index.js';

const VAPID_KEYS_FILE = resolve('vapid-keys.json');

function getVapidKeys(): { publicKey: string; privateKey: string } {
  const vapidPublicKey = config.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = config.VAPID_PRIVATE_KEY;

  if (vapidPublicKey && vapidPrivateKey) {
    return { publicKey: vapidPublicKey, privateKey: vapidPrivateKey };
  }

  if (existsSync(VAPID_KEYS_FILE)) {
    return JSON.parse(readFileSync(VAPID_KEYS_FILE, 'utf-8')) as {
      publicKey: string;
      privateKey: string;
    };
  }

  const keys = webpush.generateVAPIDKeys();
  try {
    writeFileSync(VAPID_KEYS_FILE, JSON.stringify(keys, null, 2));
    if (config.NODE_ENV === 'development')
      console.log('[PushService] Generated new VAPID keys and saved to vapid-keys.json');
  } catch (err) {
    if (config.NODE_ENV === 'development')
      console.warn('[PushService] Could not save VAPID keys to file:', err);
  }
  return keys;
}

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const keys = getVapidKeys();
  webpush.setVapidDetails(
    config.VAPID_EMAIL || 'mailto:admin@newsflow.app',
    keys.publicKey,
    keys.privateKey
  );
  initialized = true;
}

export function getVapidPublicKey(): string {
  ensureInitialized();
  return getVapidKeys().publicKey;
}

export async function subscribe(
  customerId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<void> {
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: sub.endpoint } });
  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent ?? existing.userAgent,
      },
    });
    return;
  }
  await prisma.pushSubscription.create({
    data: {
      customerId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent ?? null,
    },
  });
}

export async function unsubscribe(customerId: string, endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { customerId, endpoint },
  });
}

export async function sendToCustomer(
  customerId: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, string>;
    icon?: string;
    badge?: string;
    image?: string;
    actions?: { action: string; title: string }[];
    vibrate?: number[];
  }
): Promise<number> {
  ensureInitialized();
  const subs = await prisma.pushSubscription.findMany({ where: { customerId } });
  if (subs.length === 0) return 0;

  const pushPayload = JSON.stringify({
    ...payload,
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    vibrate: payload.vibrate || [200, 100, 200],
    data: {
      url: payload.data?.['url'] || '/',
      type: payload.data?.['type'] || 'GENERAL',
      ...payload.data,
    },
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload
      );
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  return sent;
}
