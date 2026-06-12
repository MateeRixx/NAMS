import { useEffect, useState } from 'react';
import client from '../api/client';

interface Pause {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface Subscription {
  id: string;
  productName: string;
  productType: string;
  startDate: string;
  endDate: string | null;
  status: string;
  pauses: Pause[];
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [pauseModal, setPauseModal] = useState<{ id: string; start: string; end: string; reason: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/customer-portal/subscriptions');
      setSubscriptions(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handlePause() {
    if (!pauseModal) return;
    setProcessing(true);
    try {
      await client.patch(`/customer-portal/subscriptions/${pauseModal.id}/pause`, {
        startDate: pauseModal.start,
        endDate: pauseModal.end,
        reason: pauseModal.reason || undefined,
      });
      setPauseModal(null);
      await load();
    } finally {
      setProcessing(false);
    }
  }

  async function handleResume(id: string) {
    setProcessing(true);
    try {
      await client.patch(`/customer-portal/subscriptions/${id}/resume`);
      await load();
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Subscriptions</h1>
      </div>

      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <p>No subscriptions yet</p>
          <p className="hint">Contact your agency to subscribe to newspapers or magazines</p>
        </div>
      ) : (
        <div>
          {subscriptions.map((sub) => (
            <div key={sub.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{sub.productName}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.productType}</p>
                </div>
                <span className={`badge badge-${sub.status.toLowerCase()}`}>{sub.status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Started: {new Date(sub.startDate).toLocaleDateString()}
                {sub.endDate && <> &middot; Ends: {new Date(sub.endDate).toLocaleDateString()}</>}
              </div>
              {sub.status === 'ACTIVE' && (
                <div className="action-row">
                  <button className="btn btn-sm" onClick={() => setPauseModal({ id: sub.id, start: '', end: '', reason: '' })}>
                    Pause Delivery
                  </button>
                </div>
              )}
              {sub.status === 'PAUSED' && (
                <div className="action-row">
                  <button className="btn btn-sm btn-primary" onClick={() => handleResume(sub.id)} disabled={processing}>
                    Resume Delivery
                  </button>
                </div>
              )}
              {sub.pauses.length > 0 && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Pause History ({sub.pauses.length})
                  </summary>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    {sub.pauses.map((p) => (
                      <div key={p.id} style={{ padding: '0.25rem 0', color: 'var(--text-muted)' }}>
                        {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                        {p.reason && <> ({p.reason})</>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {pauseModal && (
        <div className="modal-overlay" onClick={() => setPauseModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pause Delivery</h3>
            <div className="input-group">
              <label>Start Date</label>
              <input
                className="input"
                type="date"
                value={pauseModal.start}
                onChange={(e) => setPauseModal({ ...pauseModal, start: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>End Date</label>
              <input
                className="input"
                type="date"
                value={pauseModal.end}
                onChange={(e) => setPauseModal({ ...pauseModal, end: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Reason (optional)</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Vacation"
                value={pauseModal.reason}
                onChange={(e) => setPauseModal({ ...pauseModal, reason: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setPauseModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePause} disabled={processing || !pauseModal.start || !pauseModal.end}>
                {processing ? 'Pausing...' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
