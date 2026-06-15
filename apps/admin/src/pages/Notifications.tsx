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
    client.get('/notifications')
      .then((res) => {
        setNotifications(res.data.data.notifications);
        setTotal(res.data.data.total);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        {total > 0 && <span className="badge badge-pending">{total} total</span>}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div key={n.id} className="card" style={{
              borderLeft: n.status === 'PENDING' ? '3px solid var(--primary)' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    {n.channel} &middot; {n.status} &middot; {new Date(n.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <span className={`badge badge-${n.status.toLowerCase()}`}>{n.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
