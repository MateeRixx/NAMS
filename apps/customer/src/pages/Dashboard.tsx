import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  activeSubscriptions: number;
  totalSubscriptions: number;
  pendingComplaints: number;
  unpaidInvoices: number;
  subscriptions: {
    id: string;
    productName: string;
    status: string;
    startDate: string;
  }[];
  complaints: {
    id: string;
    type: string;
    status: string;
    createdAt: string;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    billingMonth: number;
    billingYear: number;
  }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/customer-portal/dashboard')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (!data) return <div className="loading">Failed to load dashboard</div>;

  const cards = [
    { label: 'Active Subs', value: data.activeSubscriptions, color: '#10b981' },
    { label: 'Pending Complaints', value: data.pendingComplaints, color: '#f59e0b' },
    { label: 'Unpaid Invoices', value: data.unpaidInvoices, color: '#ef4444' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Welcome, {user?.firstName}</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Here's your account overview</p>

      <div className="card-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderTopColor: c.color }}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">
          <h3>Active Subscriptions</h3>
          <Link to="/subscriptions" className="btn btn-sm">View All</Link>
        </div>
        {data.subscriptions.length === 0 ? (
          <div className="empty-state"><p>No active subscriptions</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.slice(0, 5).map((s) => (
                <tr key={s.id}>
                  <td>{s.productName}</td>
                  <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                  <td>{new Date(s.startDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="section-title">
          <h3>Recent Complaints</h3>
          <Link to="/complaints" className="btn btn-sm">View All</Link>
        </div>
        {data.complaints.length === 0 ? (
          <div className="empty-state"><p>No complaints</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.complaints.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td>{c.type.replace(/_/g, ' ')}</td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="section-title">
          <h3>Recent Invoices</h3>
          <Link to="/invoices" className="btn btn-sm">View All</Link>
        </div>
        {data.invoices.length === 0 ? (
          <div className="empty-state"><p>No invoices yet</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{new Date(inv.billingYear, inv.billingMonth - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
                  <td>₹{Number(inv.totalAmount).toFixed(2)}</td>
                  <td><span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
