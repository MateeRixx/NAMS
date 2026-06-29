import { useEffect, useState } from 'react';
import client from '../api/client';

interface Customer { id: string; firstName: string; lastName: string; }
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  billingMonth: number;
  billingYear: number;
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number;
  previousBalance: number;
  totalAmount: number;
  lockedAt: string | null;
  status: string;
  generatedAt: string;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ customerId: '', billingMonth: new Date().getMonth() + 1, billingYear: new Date().getFullYear() });
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [invRes, custRes] = await Promise.all([
        client.get('/billing/invoices'),
        client.get('/customers'),
      ]);
      setInvoices(invRes.data.data);
      setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : custRes.data.data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate() {
    if (!genForm.customerId) return;
    setGenerating(true);
    setMsg('');
    try {
      await client.post('/billing/invoices/generate', genForm);
      setShowGenerate(false);
      await load();
      setMsg('Invoice generated successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  }

  function downloadPdf(id: string) {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.open(`${base}/billing/invoices/${id}/pdf?token=${token}`, '_blank');
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let filtered = invoices;
  if (statusFilter) filtered = filtered.filter((i) => i.status === statusFilter);
  if (customerFilter) filtered = filtered.filter((i) => i.customerId === customerFilter);

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowGenerate(!showGenerate)}>
          {showGenerate ? 'Cancel' : '+ Generate Invoice'}
        </button>
      </div>

      {msg && <div className="card" style={{ background: msg.includes('success') ? '#d1fae5' : '#fee2e2', marginBottom: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{msg}</div>}

      {showGenerate && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Manual Invoice Generation</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Customer</label>
              <select className="select" value={genForm.customerId} onChange={(e) => setGenForm({ ...genForm, customerId: e.target.value })}>
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Month</label>
              <select className="select" value={genForm.billingMonth} onChange={(e) => setGenForm({ ...genForm, billingMonth: Number(e.target.value) })}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthNames[m - 1]}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Year</label>
              <input className="input" type="number" value={genForm.billingYear} onChange={(e) => setGenForm({ ...genForm, billingYear: Number(e.target.value) })} min={2024} max={2100} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || !genForm.customerId}>
            {generating ? 'Generating...' : `Generate Invoice for ${monthNames[genForm.billingMonth - 1]} ${genForm.billingYear}`}
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Status</option>
          <option value="GENERATED">Generated</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <select className="select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="loading">Loading...</div> : filtered.length === 0 ? (
        <div className="empty-state"><p>No invoices found</p></div>
      ) : (
        <div>
          {filtered.map((inv) => (
            <div key={inv.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === inv.id ? null : inv)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {monthNames[inv.billingMonth - 1]} {inv.billingYear}
                    {inv.lockedAt && ' \u2022 Locked'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>₹{Number(inv.totalAmount).toFixed(2)}</div>
                  <span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span>
                </div>
              </div>

              {selected?.id === inv.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div className="profile-field"><span className="label">Subtotal</span><span className="value">₹{Number(inv.subtotal).toFixed(2)}</span></div>
                  <div className="profile-field"><span className="label">Delivery</span><span className="value">₹{Number(inv.deliveryCharges).toFixed(2)}</span></div>
                  {Number(inv.discountAmount) > 0 && <div className="profile-field"><span className="label">Discount</span><span className="value" style={{ color: 'var(--success)' }}>-₹{Number(inv.discountAmount).toFixed(2)}</span></div>}
                  <div className="profile-field"><span className="label">Tax ({inv.taxRate}%)</span><span className="value">₹{Number(inv.taxAmount).toFixed(2)}</span></div>
                  {Number(inv.previousBalance) > 0 && <div className="profile-field"><span className="label">Previous Balance</span><span className="value">₹{Number(inv.previousBalance).toFixed(2)}</span></div>}
                  <div className="profile-field"><span className="label">Total</span><span className="value" style={{ fontWeight: 700 }}>₹{Number(inv.totalAmount).toFixed(2)}</span></div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); downloadPdf(inv.id); }}>Download PDF</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
