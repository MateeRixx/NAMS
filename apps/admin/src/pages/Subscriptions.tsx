import { useEffect, useState } from 'react';
import client from '../api/client';

interface Customer { id: string; firstName: string; lastName: string; }
interface Product { id: string; name: string; }
interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  customer?: Customer;
  product?: Product;
}

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', productId: '', startDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [pauseId, setPauseId] = useState<string | null>(null);
  const [pauseForm, setPauseForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  async function load() {
    setLoading(true);
    try {
      const [subRes, custRes, prodRes] = await Promise.all([
        client.get('/subscriptions'),
        client.get('/customers'),
        client.get('/products'),
      ]);
      setSubs(subRes.data.data);
      setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : custRes.data.data.items);
      setProducts(prodRes.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.customerId || !form.productId || !form.startDate) return;
    setSubmitting(true);
    setMsg('');
    try {
      await client.post('/subscriptions', form);
      setShowForm(false);
      setForm({ customerId: '', productId: '', startDate: '' });
      await load();
      setMsg('Subscription created'); setMsgType('success');
    } catch { setMsg('Failed to create subscription'); setMsgType('error'); }
    finally { setSubmitting(false); }
  }

  async function handleCancel(id: string) {
    setSubmitting(true);
    setMsg('');
    try {
      await client.patch(`/subscriptions/${id}/cancel`);
      setCancelId(null);
      await load();
      setMsg('Subscription cancelled'); setMsgType('success');
    } catch { setMsg('Failed to cancel subscription'); setMsgType('error'); }
    finally { setSubmitting(false); }
  }

  async function handlePause(id: string) {
    if (!pauseForm.startDate || !pauseForm.endDate) return;
    setSubmitting(true);
    setMsg('');
    try {
      await client.patch(`/subscriptions/${id}/pause`, {
        startDate: new Date(pauseForm.startDate).toISOString(),
        endDate: new Date(pauseForm.endDate).toISOString(),
        reason: pauseForm.reason || undefined,
      });
      setPauseId(null);
      setPauseForm({ startDate: '', endDate: '', reason: '' });
      await load();
      setMsg('Subscription paused'); setMsgType('success');
    } catch { setMsg('Failed to pause subscription'); setMsgType('error'); }
    finally { setSubmitting(false); }
  }

  async function handleResume(id: string) {
    setSubmitting(true);
    setMsg('');
    try {
      await client.patch(`/subscriptions/${id}/resume`);
      setResumeId(null);
      await load();
      setMsg('Subscription resumed'); setMsgType('success');
    } catch { setMsg('Failed to resume subscription'); setMsgType('error'); }
    finally { setSubmitting(false); }
  }

  const filtered = statusFilter ? subs.filter((s) => s.status === statusFilter) : subs;

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <div className="page-header">
        <h1>Subscriptions</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Subscription'}
          </button>
        </div>
      </div>

      {msg && <div className="card" style={{ background: msgType === 'error' ? '#fee2e2' : '#d1fae5', marginBottom: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>New Subscription</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Customer</label>
              <select className="select" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Product</label>
              <select className="select" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Start Date</label>
            <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting || !form.customerId || !form.productId || !form.startDate}>
            {submitting ? 'Creating...' : 'Create Subscription'}
          </button>
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : filtered.length === 0 ? (
        <div className="empty-state"><p>No subscriptions found</p></div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>{s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : <span className="mono">{s.customerId.slice(0, 8)}...</span>}</td>
                <td>{s.product?.name ?? <span className="mono">{s.productId.slice(0, 8)}...</span>}</td>
                <td>{new Date(s.startDate).toLocaleDateString()}</td>
                <td>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}</td>
                <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  {s.status === 'ACTIVE' && (
                    <>
                      <button className="btn btn-sm" onClick={() => setPauseId(s.id)} style={{ marginRight: '0.25rem' }}>Pause</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setCancelId(s.id)}>Cancel</button>
                    </>
                  )}
                  {s.status === 'PAUSED' && (
                    <button className="btn btn-sm" onClick={() => setResumeId(s.id)}>Resume</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pauseId && (
        <div className="modal-overlay" onClick={() => { setPauseId(null); setPauseForm({ startDate: '', endDate: '', reason: '' }); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pause Subscription</h2>
              <button className="modal-close" onClick={() => { setPauseId(null); setPauseForm({ startDate: '', endDate: '', reason: '' }); }}>&times;</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Set the pause period. No invoices will be generated during this time.</p>
            <div className="form-row">
              <div className="input-group">
                <label>Start Date *</label>
                <input className="input" type="date" value={pauseForm.startDate} onChange={(e) => setPauseForm({ ...pauseForm, startDate: e.target.value })} />
              </div>
              <div className="input-group">
                <label>End Date *</label>
                <input className="input" type="date" value={pauseForm.endDate} onChange={(e) => setPauseForm({ ...pauseForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label>Reason (optional)</label>
              <input className="input" value={pauseForm.reason} onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })} placeholder="e.g. Vacation" />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { setPauseId(null); setPauseForm({ startDate: '', endDate: '', reason: '' }); }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handlePause(pauseId)} disabled={submitting || !pauseForm.startDate || !pauseForm.endDate}>
                {submitting ? 'Pausing...' : 'Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resumeId && (
        <div className="modal-overlay" onClick={() => setResumeId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Resume Subscription</h2>
              <button className="modal-close" onClick={() => setResumeId(null)}>&times;</button>
            </div>
            <p>Billing will resume as normal from today.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setResumeId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleResume(resumeId)} disabled={submitting}>
                {submitting ? 'Resuming...' : 'Yes, Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Subscription</h2>
              <button className="modal-close" onClick={() => setCancelId(null)}>&times;</button>
            </div>
            <p>A final invoice will be generated for days used. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setCancelId(null)}>Keep</button>
              <button className="btn btn-danger" onClick={() => handleCancel(cancelId)} disabled={submitting}>
                {submitting ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
