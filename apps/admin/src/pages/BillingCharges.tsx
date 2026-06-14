import { useEffect, useState } from 'react';
import client from '../api/client';

interface Charge {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE';
  isActive: boolean;
}

export default function BillingCharges() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', amount: '', type: 'FIXED' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/billing-charges');
      setCharges(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name || !form.amount) { setFormError('Name and amount are required'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        amount: parseFloat(form.amount),
        type: form.type,
      };
      if (form.description) payload.description = form.description;
      if (editId) {
        await client.patch(`/billing-charges/${editId}`, payload);
      } else {
        await client.post('/billing-charges', payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', description: '', amount: '', type: 'FIXED' });
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save charge');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: Charge) {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description ?? '', amount: String(c.amount), type: c.type });
    setShowForm(true);
  }

  async function toggleActive(c: Charge) {
    try {
      await client.patch(`/billing-charges/${c.id}`, { isActive: !c.isActive });
      await load();
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this charge?')) return;
    try {
      await client.delete(`/billing-charges/${id}`);
      await load();
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Billing Charges</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '', amount: '', type: 'FIXED' }); }}>
          {showForm ? 'Cancel' : '+ Add Charge'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editId ? 'Edit Charge' : 'New Charge'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="FIXED">Fixed (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div className="input-group">
              <label>{form.type === 'FIXED' ? 'Amount (₹) *' : 'Percentage (%) *'}</label>
              <input className="input" type="number" step="0.01" min="0" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editId ? 'Update Charge' : 'Create Charge'}
          </button>
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : (
        <div>
          {charges.length === 0 ? (
            <div className="loading">No charges defined yet. Add your first charge.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.description ?? '--'}</td>
                    <td>{c.type === 'FIXED' ? `₹${c.amount.toFixed(2)}` : `${c.amount}%`}</td>
                    <td><span className="badge">{c.type}</span></td>
                    <td><span className={`badge ${c.isActive ? 'badge-active' : 'badge-inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-sm" onClick={() => startEdit(c)}>Edit</button>
                        <button className="btn btn-sm" onClick={() => toggleActive(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</button>
                        <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
