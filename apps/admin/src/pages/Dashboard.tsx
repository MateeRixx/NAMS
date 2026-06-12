import { useEffect, useState } from 'react';
import client from '../api/client';

interface Counts {
  customers: { total: number };
  products: { length: number };
  subscriptions: { total: number };
  complaints: { total: number };
  invoices: { total: number };
  zones: { length: number };
}

export default function Dashboard() {
  const [data, setData] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/customers'),
      client.get('/products'),
      client.get('/subscriptions'),
      client.get('/complaints'),
      client.get('/billing/invoices'),
      client.get('/delivery-zones'),
    ]).then(([c, p, s, co, i, z]) => {
      setData({
        customers: c.data.data,
        products: p.data.data,
        subscriptions: s.data.data,
        complaints: co.data.data,
        invoices: i.data.data,
        zones: z.data.data,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const cards = [
    { label: 'Customers', value: data?.customers.total ?? 0, color: '#3b82f6' },
    { label: 'Products', value: data?.products.length ?? 0, color: '#10b981' },
    { label: 'Subscriptions', value: data?.subscriptions.total ?? 0, color: '#f59e0b' },
    { label: 'Complaints', value: data?.complaints.total ?? 0, color: '#ef4444' },
    { label: 'Invoices', value: data?.invoices.total ?? 0, color: '#8b5cf6' },
    { label: 'Delivery Zones', value: data?.zones.length ?? 0, color: '#ec4899' },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderTopColor: c.color }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
