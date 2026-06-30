import { useEffect, useState } from 'react';
import client from '../api/client';

interface DashboardStats {
  customers: number;
  activeCustomers: number;
  products: number;
  subscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  complaints: number;
  pendingComplaints: number;
  invoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  outstandingAmount: number;
  deliveryZones: number;
  newCustomersThisMonth: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/reports/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="loading" style={{ color: 'var(--danger)' }}>{error}</div>;

  const cards = [
    { label: 'Active Customers', value: data?.activeCustomers ?? 0, sub: `${data?.customers ?? 0} total`, color: '#3b82f6' },
    { label: 'Revenue (Paid)', value: `₹${(data?.totalRevenue ?? 0).toLocaleString()}`, sub: `${data?.paidInvoices ?? 0} paid invoices`, color: '#10b981' },
    { label: 'Outstanding', value: `₹${(data?.outstandingAmount ?? 0).toLocaleString()}`, sub: `${data?.overdueInvoices ?? 0} overdue`, color: '#ef4444' },
    { label: 'Pending Complaints', value: data?.pendingComplaints ?? 0, sub: `${data?.complaints ?? 0} total`, color: '#f59e0b' },
    { label: 'Active Subscriptions', value: data?.activeSubscriptions ?? 0, sub: `${data?.pausedSubscriptions ?? 0} paused`, color: '#8b5cf6' },
    { label: 'Products', value: data?.products ?? 0, sub: `${data?.deliveryZones ?? 0} zones`, color: '#ec4899' },
  ];

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <h1>Dashboard</h1>
      <div className="card-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderTopColor: c.color }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
