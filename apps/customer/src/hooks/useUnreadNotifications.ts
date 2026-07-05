import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useUnreadNotifications() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }

    async function fetchCount() {
      try {
        const res = await client.get('/customer-portal/notifications/unread-count');
        setCount(res.data?.data?.count ?? 0);
      } catch {
        // silent
      }
    }

    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  return count;
}
