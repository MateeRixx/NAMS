import { useEffect, useState } from 'react';
import client from '../api/client';

interface MonthlyRevenue {
  month: number;
  year: number;
  total: number;
  count: number;
  paid: number;
}

interface RevenueReport {
  totalRevenue: number;
  totalPaid: number;
  outstanding: number;
  totalInvoices: number;
  monthly: MonthlyRevenue[];
}

interface ProductReportEntry {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  isActive: boolean;
  totalSubscribers: number;
  activeSubscribers: number;
}

interface ComplaintReport {
  total: number;
  byType: { type: string; count: number; resolved: number }[];
  byStatus: Record<string, number>;
  avgResolutionHours: number;
}

interface GrowthEntry {
  month: string;
  newCustomers: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
}

interface CollectionReport {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  collectionRate: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  aging: Record<string, { count: number; amount: number }>;
}

type Tab = 'revenue' | 'products' | 'complaints' | 'growth' | 'collections';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('revenue');
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [products, setProducts] = useState<ProductReportEntry[]>([]);
  const [complaints, setComplaints] = useState<ComplaintReport | null>(null);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [collections, setCollections] = useState<CollectionReport | null>(null);
  const [loading, setLoading] = useState(true);

  function loadAll() {
    setLoading(true);
    Promise.all([
      client.get('/reports/revenue'),
      client.get('/reports/products'),
      client.get('/reports/complaints'),
      client.get('/reports/growth'),
      client.get('/reports/collections'),
    ]).then(([r, p, c, g, col]) => {
      setRevenue(r.data.data);
      setProducts(p.data.data);
      setComplaints(c.data.data);
      setGrowth(g.data.data);
      setCollections(col.data.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'products', label: 'Products' },
    { key: 'complaints', label: 'Complaints' },
    { key: 'growth', label: 'Growth' },
    { key: 'collections', label: 'Collections' },
  ];

  return (
    <div>
      <h1>Reports</h1>
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-sm'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'revenue' && revenue && (
        <div>
          <div className="card-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card" style={{ borderTopColor: '#10b981' }}>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{revenue.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#3b82f6' }}>
              <div className="stat-label">Collected</div>
              <div className="stat-value">₹{revenue.totalPaid.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#ef4444' }}>
              <div className="stat-label">Outstanding</div>
              <div className="stat-value">₹{revenue.outstanding.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#f59e0b' }}>
              <div className="stat-label">Invoices</div>
              <div className="stat-value">{revenue.totalInvoices}</div>
            </div>
          </div>

          <h3>Monthly Breakdown</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Invoices</th>
                <th>Total</th>
                <th>Collected</th>
              </tr>
            </thead>
            <tbody>
              {revenue.monthly.map((m) => (
                <tr key={`${m.year}-${m.month}`}>
                  <td>{new Date(m.year, m.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                  <td>{m.count}</td>
                  <td>₹{m.total.toLocaleString()}</td>
                  <td>₹{m.paid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'products' && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Base Price</th>
              <th>Status</th>
              <th>Total Subs</th>
              <th>Active Subs</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><span className="badge">{p.type}</span></td>
                <td>₹{p.basePrice}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: p.isActive ? '#10b981' : '#6b7280' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{p.totalSubscribers}</td>
                <td>{p.activeSubscribers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'complaints' && complaints && (
        <div>
          <div className="card-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card" style={{ borderTopColor: '#f59e0b' }}>
              <div className="stat-label">Total Complaints</div>
              <div className="stat-value">{complaints.total}</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#3b82f6' }}>
              <div className="stat-label">Avg Resolution</div>
              <div className="stat-value">{complaints.avgResolutionHours}h</div>
              <div className="stat-sub">Average hours to resolve</div>
            </div>
          </div>

          <h3>By Type</h3>
          <table className="table" style={{ marginBottom: '1rem' }}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Total</th>
                <th>Resolved</th>
                <th>Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {complaints.byType.map((t) => (
                <tr key={t.type}>
                  <td><span className="badge">{t.type}</span></td>
                  <td>{t.count}</td>
                  <td>{t.resolved}</td>
                  <td>{t.count > 0 ? Math.round((t.resolved / t.count) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>By Status</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(complaints.byStatus).map(([status, count]) => (
                <tr key={status}>
                  <td><span className="badge">{status}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'growth' && (
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>New Customers</th>
              <th>New Subscriptions</th>
              <th>Cancelled</th>
              <th>Net Growth</th>
            </tr>
          </thead>
          <tbody>
            {growth.map((g) => (
              <tr key={g.month}>
                <td>{g.month}</td>
                <td>{g.newCustomers}</td>
                <td>{g.newSubscriptions}</td>
                <td>{g.cancelledSubscriptions}</td>
                <td>{g.newSubscriptions - g.cancelledSubscriptions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'collections' && collections && (
        <div>
          <div className="card-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card" style={{ borderTopColor: '#10b981' }}>
              <div className="stat-label">Collection Rate</div>
              <div className="stat-value">{collections.collectionRate}%</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#3b82f6' }}>
              <div className="stat-label">Total Billed</div>
              <div className="stat-value">₹{collections.totalBilled.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#10b981' }}>
              <div className="stat-label">Collected</div>
              <div className="stat-value">₹{collections.totalCollected.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: '#ef4444' }}>
              <div className="stat-label">Outstanding</div>
              <div className="stat-value">₹{collections.outstanding.toLocaleString()}</div>
            </div>
          </div>

          <h3>Aging Report</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Invoices</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(collections.aging).map(([period, data]) => (
                <tr key={period}>
                  <td>{period} days</td>
                  <td>{data.count}</td>
                  <td>₹{data.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
