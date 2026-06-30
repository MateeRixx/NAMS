import { useEffect, useState } from 'react';
import client from '../api/client';
import ConfirmModal from '../components/ConfirmModal';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  monthlyCharge: number;
  createdAt: string;
}

export default function DeliveryZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', monthlyCharge: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/delivery-zones');
      setZones(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ name: '', description: '', monthlyCharge: '' });
    setEditId(null);
    setShowForm(false);
    setMsg('');
  }

  function startEdit(zone: Zone) {
    setForm({ name: zone.name, description: zone.description ?? '', monthlyCharge: String(zone.monthlyCharge) });
    setEditId(zone.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setMsg('');
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined, monthlyCharge: Number(form.monthlyCharge) || 0 };
      if (editId) {
        await client.patch(`/delivery-zones/${editId}`, payload);
      } else {
        await client.post('/delivery-zones', payload);
      }
      resetForm();
      await load();
      setMsg(editId ? 'Zone updated' : 'Zone created');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to save zone');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setMsg('');
    try {
      await client.delete(`/delivery-zones/${id}`);
      setDeleteConfirm(null);
      await load();
      setMsg('Zone deleted');
    } catch {
      setMsg('Failed to delete zone');
    }
  }

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <div className="page-header">
        <h1>Delivery Zones</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
          {showForm ? 'Cancel' : '+ New Zone'}
        </button>
      </div>

      {msg && <div className="card" style={{ background: '#d1fae5', marginBottom: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>{editId ? 'Edit Zone' : 'New Zone'}</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Zone name" />
            </div>
            <div className="input-group">
              <label>Monthly Charge (₹)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.monthlyCharge} onChange={(e) => setForm({ ...form, monthlyCharge: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div className="input-group">
            <label>Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={submitting || !form.name.trim()}>
              {submitting ? 'Saving...' : editId ? 'Update Zone' : 'Create Zone'}
            </button>
            <button className="btn" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : zones.length === 0 ? (
        <div className="empty-state"><p>No delivery zones defined</p></div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Monthly Charge</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td><strong>{z.name}</strong></td>
                <td>{z.description ?? '-'}</td>
                <td>₹{Number(z.monthlyCharge).toFixed(2)}</td>
                <td>{new Date(z.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-sm" onClick={() => startEdit(z)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(z.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete Zone"
        message="Delete this delivery zone?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
