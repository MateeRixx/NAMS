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
  history: { action: string; notes: string | null; createdAt: string }[];
}

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/complaints')
      .then((res) => setComplaints(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    RESOLVED: '#10b981',
    CLOSED: '#6b7280',
  };

  return (
    <div>
      <h1>Complaints</h1>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Resolved</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <>
                <tr key={c.id}>
                  <td><span className="badge">{c.type}</span></td>
                  <td>{c.description}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: statusColor[c.status] || '#6b7280' }}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : '-'}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                      {expanded === c.id ? 'Hide' : 'Timeline'}
                    </button>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-tl`}>
                    <td colSpan={6}>
                      <div className="timeline">
                        {c.history.map((h, i) => (
                          <div key={i} className="tl-item">
                            <div className="tl-dot" />
                            <div>
                              <strong>{h.action}</strong>
                              {h.notes && <p>{h.notes}</p>}
                              <small>{new Date(h.createdAt).toLocaleString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
