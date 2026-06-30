import { useEffect, useState } from 'react';
import client from '../api/client';

interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/customer-portal/notifications')
      .then((res) => {
        const d = res.data.data;
        if (Array.isArray(d)) {
          setNotifications(d);
          setTotal(d.length);
        } else {
          setNotifications(d.notifications ?? []);
          setTotal(d.total ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Notifications</h1>
        {total > 0 && <span className="badge badge-pending">{total}</span>}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications yet</p>
          <p className="hint">Notifications will appear here when something happens</p>
        </div>
      ) : (
        <div>
          {notifications.map((n) => (
            <div key={n.id} className="card" style={{
              borderLeft: n.status === 'PENDING' ? '3px solid var(--primary)' : '3px solid transparent',
              opacity: n.status === 'SENT' ? 0.7 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className={`badge badge-${n.channel.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                  {n.channel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
