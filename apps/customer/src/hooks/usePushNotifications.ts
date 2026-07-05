import { useEffect, useCallback } from 'react';
import client from '../api/client';

export function usePushNotifications() {

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'default') return;

    const registerPush = async () => {
      try {
        const token = localStorage.getItem('customer_token');
        if (!token) return;

        const registration = await navigator.serviceWorker.ready;

        const vapidRes = await client.get('/push/vapid-public-key');
        const publicKey = vapidRes.data?.data?.publicKey;
        if (!publicKey) return;

        const convertedKey = Uint8Array.from(
          atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')),
          (c) => c.charCodeAt(0)
        );

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        const subJSON = subscription.toJSON();
        await client.post('/push/subscribe', subJSON);
      } catch (err) {
        console.warn('[Push] Subscription error:', err);
      }
    };

    registerPush();
  }, []);

  return { requestPermission };
}
