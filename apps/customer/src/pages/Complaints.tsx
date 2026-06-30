import { useEffect, useState } from 'react';
import client from '../api/client';

interface Complaint {
  id: string;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const complaintTypes = ['MISSED_DELIVERY', 'DAMAGED_PAPER', 'WRONG_PRODUCT', 'LATE_DELIVERY', 'OTHER'] as const;

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<string>('MISSED_DELIVERY');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/customer-portal/complaints');
      setComplaints(res.data.data);
    } catch {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit() {
    if (!type) { setError('Select a complaint type'); return; }
    setSubmitting(true);
    setError('');
    try {
      await client.post('/customer-portal/complaints', { type, description: description || undefined });
      setShowForm(false);
      setType('MISSED_DELIVERY');
      setDescription('');
      setError('Complaint submitted successfully');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Complaints</h1>
        <button className="btn btn-sm btn-primary" onClick={() => { setShowForm(!showForm); setError(''); }}>
          {showForm ? 'Cancel' : 'New Complaint'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Raise a Complaint</h3>
          <div className="input-group">
            <label>Type</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              {complaintTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Description (optional)</label>
            <textarea
              className="textarea"
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="empty-state">
          <p>No complaints</p>
          <p className="hint">All your complaints will appear here</p>
        </div>
      ) : (
        <div>
          {complaints.map((c) => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.type.replace(/_/g, ' ')}</span>
                </div>
                <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
              </div>
              {c.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{c.description}</p>}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString()}
                {c.resolvedAt && <> &middot; Resolved: {new Date(c.resolvedAt).toLocaleDateString()}</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
