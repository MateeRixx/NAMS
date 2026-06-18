import { useEffect, useState } from 'react';
import client from '../api/client';

interface AuditLog {
  id: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pageSize = 50;

  useEffect(() => {
    setLoading(true);
    client.get('/audit-logs', { params: { page, pageSize } })
      .then((res) => {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="loading">Loading...</div>;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page">
      <h1>Audit Logs</h1>
      <p className="text-muted">Total: {total} entries</p>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Entity</th>
              <th>Action</th>
              <th>User</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.entityType}:{log.entityId.slice(0, 8)}</td>
                <td><code>{log.action}</code></td>
                <td>{log.userId ? log.userId.slice(0, 8) : '-'}</td>
                <td>
                  <button
                    className="btn btn-sm"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    {expanded === log.id ? 'Hide' : 'View'}
                  </button>
                  {expanded === log.id && (
                    <div className="mt-1" style={{ fontSize: '0.85rem' }}>
                      {log.oldValue && (
                        <div>
                          <strong>Old:</strong>
                          <pre>{JSON.stringify(log.oldValue, null, 2)}</pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <strong>New:</strong>
                          <pre>{JSON.stringify(log.newValue, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="mx-1">Page {page} of {totalPages}</span>
          <button
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
