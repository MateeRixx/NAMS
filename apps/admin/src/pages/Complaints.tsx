import { useEffect, useState } from 'react';
import client from '../api/client';

interface Complaint {
  id: string;
  customerId: string;
  type: string;
  description: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  history: { action: string; notes: string | null; performedBy: string; createdAt: string }[];
}

const statusFlow: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

const statusColor: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; nextStatus: string } | null>(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await client.get(`/complaints${params}`);
      setComplaints(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleStatusUpdate(id: string, newStatus: string) {
    setProcessing(id);
    try {
      await client.patch(`/complaints/${id}/status`, { status: newStatus });
      setNoteModal(null);
      setNote('');
      await load();
    } catch {
      setMsg('Failed to update status');
    } finally {
      setProcessing(null);
    }
  }

  async function handleUpdateWithNote() {
    if (!noteModal) return;
    setProcessing(noteModal.id);
    try {
      await client.patch(`/complaints/${noteModal.id}/status`, { status: noteModal.nextStatus, notes: note || undefined });
      setNoteModal(null);
      setNote('');
      await load();
    } catch {
      setMsg('Failed to update status');
    } finally {
      setProcessing(null);
    }
  }

  const filtered = statusFilter ? complaints.filter((c) => c.status === statusFilter) : complaints;

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <div className="page-header">
        <h1>Complaints</h1>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {msg && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{msg}</div>}

      {loading ? <div className="loading">Loading...</div> : filtered.length === 0 ? (
        <div className="empty-state"><p>No complaints found</p></div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Resolved</th>
              <th>Created</th>
              <th>Actions</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const nextStatuses = statusFlow[c.status] ?? [];
              return (
                <>
                  <tr key={c.id}>
                    <td><span className="badge">{c.type.replace(/_/g, ' ')}</span></td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: statusColor[c.status] || '#6b7280' }}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '-'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {nextStatuses.map((ns) => (
                          <button
                            key={ns}
                            className="btn btn-sm"
                            onClick={() => setNoteModal({ id: c.id, nextStatus: ns })}
                            disabled={processing === c.id}
                          >
                            {ns === 'IN_PROGRESS' ? 'Take' : ns === 'RESOLVED' ? 'Resolve' : ns === 'CLOSED' ? 'Close' : ns}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                        {expanded === c.id ? 'Hide' : 'Timeline'}
                      </button>
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-tl`}>
                      <td colSpan={7}>
                        <div className="timeline">
                          {c.history.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No history recorded</p>
                          ) : (
                            c.history.map((h, i) => (
                              <div key={i} className="tl-item">
                                <div className="tl-dot" />
                                <div>
                                  <strong>{h.action}</strong>
                                  {h.notes && <p>{h.notes}</p>}
                                  <small>{h.performedBy} &middot; {new Date(h.createdAt).toLocaleString()}</small>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      )}

      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Status to {noteModal.nextStatus}</h2>
              <button className="modal-close" onClick={() => setNoteModal(null)}>&times;</button>
            </div>
            <div className="input-group">
              <label>Notes (optional)</label>
              <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add notes..." rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setNoteModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateWithNote} disabled={processing === noteModal.id}>
                {processing === noteModal.id ? 'Updating...' : `Mark as ${noteModal.nextStatus}`}
              </button>
              <button className="btn btn-sm" onClick={() => { handleStatusUpdate(noteModal.id, noteModal.nextStatus); setNoteModal(null); }} style={{ marginLeft: '0.25rem' }}>
                Skip Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
