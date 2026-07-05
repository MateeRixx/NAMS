import { useEffect, useState } from 'react';
import client from '../api/client';

export default function PushNotificationManager() {
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const token = localStorage.getItem('customer_token');
    if (!token) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') return;
      if (event.data?.type === 'PUSH_NOTIFICATION') {
        setToast({ title: event.data.data?.title || 'NewsFlow', body: event.data.data?.body || '' });
        setTimeout(() => setToast(null), 5000);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        const vapidRes = await client.get('/push/vapid-public-key');
        const publicKey = vapidRes.data?.data?.publicKey;
        if (!publicKey) return;

        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          const subJSON = existingSub.toJSON();
          await client.post('/push/subscribe', subJSON).catch(() => {});
          return;
        }

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
        console.warn('[PWA] Push subscription:', err);
      }
    };

    if (Notification.permission === 'granted') {
      subscribe();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') subscribe();
      });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="notification-toast" onClick={() => setToast(null)}>
      <strong>{toast.title}</strong>
      <p>{toast.body}</p>
    </div>
  );
}
