import { useEffect, useState } from 'react';
import client from '../api/client';
import PromptModal from '../components/PromptModal';

interface DistZone {
  id: string;
  deliveryZoneId: string;
  deliveryZone: { id: string; name: string };
  quantity: number;
}

interface DistributionRequest {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  requestedQuantity: number;
  quotedPrice: number | null;
  status: string;
  createdAt: string;
  zones?: DistZone[];
}

interface ArticleRequest {
  id: string;
  customerId: string;
  title: string;
  content: string;
  status: string;
  productId: string | null;
  publishInDate: string | null;
  reviewNotes: string | null;
  createdAt: string;
  product?: { name: string } | null;
}

const distStatusColor: Record<string, string> = {
  PENDING: '#f59e0b',
  QUOTED: '#3b82f6',
  APPROVED: '#8b5cf6',
  IN_PROGRESS: '#06b6d4',
  COMPLETED: '#10b981',
  CANCELLED: '#6b7280',
};

const articleStatusColor: Record<string, string> = {
  SUBMITTED: '#f59e0b',
  UNDER_REVIEW: '#3b82f6',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  PUBLISHED: '#8b5cf6',
};

export default function Marketplace() {
  const [tab, setTab] = useState<'distribution' | 'article'>('distribution');
  const [distRequests, setDistRequests] = useState<DistributionRequest[]>([]);
  const [articleRequests, setArticleRequests] = useState<ArticleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDist, setSelectedDist] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [promptModal, setPromptModal] = useState<{ type: 'price' | 'notes' | 'reject'; requestId: string } | null>(null);

  function loadAll() {
    setLoading(true);
    Promise.all([
      client.get('/marketplace/distribution-requests'),
      client.get('/marketplace/article-requests'),
    ]).then(([distRes, articleRes]) => {
      setDistRequests(distRes.data.data);
      setArticleRequests(articleRes.data.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function updateDist(id: string, data: Record<string, unknown>) {
    await client.patch(`/marketplace/distribution-requests/${id}`, data);
    await loadAll();
  }

  async function updateArticle(id: string, data: Record<string, unknown>) {
    await client.patch(`/marketplace/article-requests/${id}`, data);
    await loadAll();
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <h1>Marketplace</h1>
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button
          className={`btn ${tab === 'distribution' ? 'btn-primary' : 'btn-sm'}`}
          onClick={() => setTab('distribution')}
        >
          Distribution Requests
        </button>
        <button
          className={`btn ${tab === 'article' ? 'btn-primary' : 'btn-sm'}`}
          onClick={() => setTab('article')}
        >
          Article Requests
        </button>
      </div>

      {tab === 'distribution' && (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Quantity</th>
              <th>Areas</th>
              <th>Quoted Price</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {distRequests.map((d) => (
              <>
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.requestedQuantity}</td>
                  <td>
                    {d.zones && d.zones.length > 0
                      ? d.zones.map((z) => `${z.deliveryZone.name}: ${z.quantity}`).join(', ')
                      : '-'}
                  </td>
                  <td>{d.quotedPrice != null ? `₹${d.quotedPrice}` : '-'}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: distStatusColor[d.status] || '#6b7280' }}>
                      {d.status}
                    </span>
                  </td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setSelectedDist(selectedDist === d.id ? null : d.id)}>
                      {selectedDist === d.id ? 'Close' : 'Manage'}
                    </button>
                  </td>
                </tr>
                {selectedDist === d.id && (
                  <tr key={`${d.id}-actions`}>
                    <td colSpan={7}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {d.status === 'PENDING' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => setPromptModal({ type: 'price', requestId: d.id })}>
                              Provide Quotation
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => updateDist(d.id, { status: 'CANCELLED' })}>
                              Cancel
                            </button>
                          </>
                        )}
                        {d.status === 'APPROVED' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateDist(d.id, { status: 'IN_PROGRESS' })}>
                            Start Distribution
                          </button>
                        )}
                        {d.status === 'IN_PROGRESS' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateDist(d.id, { status: 'COMPLETED' })}>
                            Mark Completed
                          </button>
                        )}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.25rem' }}>
                          {d.description && <>Description: {d.description}<br /></>}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {distRequests.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No distribution requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <PromptModal
        open={promptModal?.type === 'price'}
        title="Provide Quotation"
        label="Quoted Price (₹)"
        placeholder="Enter price"
        confirmLabel="Submit Price"
        onConfirm={(val) => {
          if (val && !isNaN(Number(val))) {
            updateDist(promptModal!.requestId, { quotedPrice: Number(val) });
          }
          setPromptModal(null);
        }}
        onCancel={() => setPromptModal(null)}
      />

      <PromptModal
        open={promptModal?.type === 'notes'}
        title="Approve Article"
        label="Review Notes (optional)"
        placeholder="Add notes..."
        confirmLabel="Approve"
        onConfirm={(val) => {
          updateArticle(promptModal!.requestId, { status: 'APPROVED', reviewNotes: val || undefined });
          setPromptModal(null);
        }}
        onCancel={() => setPromptModal(null)}
      />

      <PromptModal
        open={promptModal?.type === 'reject'}
        title="Reject Article"
        label="Rejection Reason"
        placeholder="Enter reason..."
        confirmLabel="Reject"
        onConfirm={(val) => {
          updateArticle(promptModal!.requestId, { status: 'REJECTED', reviewNotes: val || undefined });
          setPromptModal(null);
        }}
        onCancel={() => setPromptModal(null)}
      />

      {tab === 'article' && (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Newspaper</th>
              <th>Publish In</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {articleRequests.map((a) => (
              <>
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.product?.name || '-'}</td>
                  <td>{a.publishInDate ? new Date(a.publishInDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: articleStatusColor[a.status] || '#6b7280' }}>
                      {a.status}
                    </span>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setSelectedArticle(selectedArticle === a.id ? null : a.id)}>
                      {selectedArticle === a.id ? 'Close' : 'Manage'}
                    </button>
                  </td>
                </tr>
                {selectedArticle === a.id && (
                  <tr key={`${a.id}-actions`}>
                    <td colSpan={6}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {a.status === 'SUBMITTED' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateArticle(a.id, { status: 'UNDER_REVIEW' })}>
                            Start Review
                          </button>
                        )}
                        {a.status === 'UNDER_REVIEW' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => setPromptModal({ type: 'notes', requestId: a.id })}>
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setPromptModal({ type: 'reject', requestId: a.id })}>
                              Reject
                            </button>
                          </>
                        )}
                        {a.status === 'APPROVED' && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateArticle(a.id, { status: 'PUBLISHED' })}>
                            Mark Published
                          </button>
                        )}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'pre-wrap' }}>
                          <strong>Content:</strong> {a.content.substring(0, 200)}{a.content.length > 200 ? '...' : ''}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {articleRequests.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No article requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
