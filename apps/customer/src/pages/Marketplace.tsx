import { useEffect, useState } from 'react';
import client from '../api/client';

interface DeliveryZone { id: string; name: string; }

interface DistZone {
  id: string;
  deliveryZoneId: string;
  deliveryZone: { id: string; name: string };
  quantity: number;
}

interface DistributionRequest {
  id: string;
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
  title: string;
  content: string;
  status: string;
  productId: string | null;
  publishInDate: string | null;
  reviewNotes: string | null;
  createdAt: string;
  product?: { name: string } | null;
}

interface Product { id: string; name: string; type: string; }

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
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDistForm, setShowDistForm] = useState(false);
  const [distTitle, setDistTitle] = useState('');
  const [distDescription, setDistDescription] = useState('');
  const [zoneQty, setZoneQty] = useState<Record<string, number>>({});
  const [distSubmitting, setDistSubmitting] = useState(false);
  const [distError, setDistError] = useState('');

  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleProductId, setArticleProductId] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articlePublishDate, setArticlePublishDate] = useState('');
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [articleError, setArticleError] = useState('');

  const totalQuantity = Object.values(zoneQty).reduce((s, v) => s + (v || 0), 0);

  async function load() {
    setLoading(true);
    try {
      const [distRes, articleRes, prodRes, zoneRes] = await Promise.all([
        client.get('/customer-portal/distribution-requests'),
        client.get('/customer-portal/article-requests'),
        client.get('/customer-portal/products'),
        client.get('/customer-portal/delivery-zones'),
      ]);
      setDistRequests(distRes.data.data);
      setArticleRequests(articleRes.data.data);
      setProducts(prodRes.data.data);
      setZones(zoneRes.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetDistForm() {
    setShowDistForm(false);
    setDistTitle('');
    setDistDescription('');
    setZoneQty({});
    setDistError('');
  }

  async function handleCreateDist() {
    if (!distTitle) { setDistError('Title is required'); return; }
    if (totalQuantity === 0) { setDistError('Enter quantity for at least one area'); return; }
    setDistSubmitting(true);
    setDistError('');
    try {
      const zonesArr = Object.entries(zoneQty)
        .filter(([, q]) => q > 0)
        .map(([deliveryZoneId, quantity]) => ({ deliveryZoneId, quantity }));
      await client.post('/customer-portal/distribution-requests', {
        title: distTitle,
        description: distDescription || undefined,
        requestedQuantity: totalQuantity,
        zones: zonesArr,
      });
      resetDistForm();
      await load();
    } catch (err: unknown) {
      setDistError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setDistSubmitting(false);
    }
  }

  async function handleCreateArticle() {
    if (!articleTitle || !articleContent) { setArticleError('Title and content are required'); return; }
    setArticleSubmitting(true);
    setArticleError('');
    try {
      await client.post('/customer-portal/article-requests', {
        productId: articleProductId || undefined,
        title: articleTitle,
        content: articleContent,
        publishInDate: articlePublishDate ? new Date(articlePublishDate).toISOString() : undefined,
      });
      setShowArticleForm(false);
      setArticleProductId('');
      setArticleTitle('');
      setArticleContent('');
      setArticlePublishDate('');
      await load();
    } catch (err: unknown) {
      setArticleError(err instanceof Error ? err.message : 'Failed to submit article');
    } finally {
      setArticleSubmitting(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Marketplace</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'distribution' ? 'btn-primary' : 'btn-sm'}`} onClick={() => setTab('distribution')}>
          Pamphlet Distribution
        </button>
        <button className={`btn ${tab === 'article' ? 'btn-primary' : 'btn-sm'}`} onClick={() => setTab('article')}>
          Article Publication
        </button>
      </div>

      {tab === 'distribution' && (
        <>
          <button className="btn btn-sm btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setShowDistForm(!showDistForm)}>
            {showDistForm ? 'Cancel' : 'Request Pamphlet Distribution'}
          </button>

          {showDistForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>New Distribution Request</h3>
              <div className="input-group">
                <label>Title</label>
                <input className="input" placeholder="e.g. Festival Sale Pamphlet" value={distTitle} onChange={(e) => setDistTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Description (optional)</label>
                <textarea className="textarea" placeholder="Any specific instructions..." value={distDescription} onChange={(e) => setDistDescription(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Select Areas &amp; Quantities</label>
                {zones.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No delivery zones available. Contact admin.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {zones.map((z) => (
                      <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ minWidth: '140px', fontSize: '0.9rem' }}>{z.name}</span>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          placeholder="Qty"
                          style={{ width: '100px' }}
                          value={zoneQty[z.id] ?? ''}
                          onChange={(e) => setZoneQty((p) => ({ ...p, [z.id]: e.target.value ? Number(e.target.value) : 0 }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total: {totalQuantity} pamphlets</p>
              {distError && <p className="error-text">{distError}</p>}
              <button className="btn btn-primary btn-block" onClick={handleCreateDist} disabled={distSubmitting}>
                {distSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          )}

          {distRequests.length === 0 ? (
            <div className="empty-state">
              <p>No distribution requests</p>
              <p className="hint">Request pamphlet distribution and track it here</p>
            </div>
          ) : (
            <div>
              {distRequests.map((d) => (
                <div key={d.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.title}</span>
                    </div>
                    <span className="badge" style={{ backgroundColor: distStatusColor[d.status] || '#6b7280', color: '#fff' }}>
                      {d.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                    Total: {d.requestedQuantity} pamphlets
                    {d.quotedPrice != null && <> &middot; Quoted: ₹{d.quotedPrice}</>}
                  </div>
                  {d.zones && d.zones.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {d.zones.map((z) => (
                        <span key={z.id} style={{ background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {z.deliveryZone.name}: {z.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                  {d.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.description}</p>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'article' && (
        <>
          <button className="btn btn-sm btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setShowArticleForm(!showArticleForm)}>
            {showArticleForm ? 'Cancel' : 'Submit Article'}
          </button>

          {showArticleForm && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>New Article Submission</h3>
              <div className="input-group">
                <label>Newspaper</label>
                <select className="select" value={articleProductId} onChange={(e) => setArticleProductId(e.target.value)}>
                  <option value="">-- Select Newspaper --</option>
                  {products.filter((p) => p.type === 'NEWSPAPER').map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Title</label>
                <input className="input" placeholder="Article title" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Content</label>
                <textarea className="textarea" rows={6} placeholder="Write your article, notice, or advertisement here..." value={articleContent} onChange={(e) => setArticleContent(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Publish Date</label>
                <input className="input" type="date" value={articlePublishDate} onChange={(e) => setArticlePublishDate(e.target.value)} />
              </div>
              {articleError && <p className="error-text">{articleError}</p>}
              <button className="btn btn-primary btn-block" onClick={handleCreateArticle} disabled={articleSubmitting}>
                {articleSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          )}

          {articleRequests.length === 0 ? (
            <div className="empty-state">
              <p>No article submissions</p>
              <p className="hint">Submit articles, notices, or advertisements for publication</p>
            </div>
          ) : (
            <div>
              {articleRequests.map((a) => (
                <div key={a.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</span>
                    </div>
                    <span className="badge" style={{ backgroundColor: articleStatusColor[a.status] || '#6b7280', color: '#fff' }}>
                      {a.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                    {a.product?.name && <><strong>Newspaper:</strong> {a.product.name} &middot; </>}
                    {a.publishInDate && <><strong>Publish:</strong> {new Date(a.publishInDate).toLocaleDateString()}</>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>
                    {a.content.substring(0, 150)}{a.content.length > 150 ? '...' : ''}
                  </p>
                  {a.reviewNotes && (
                    <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      Review: {a.reviewNotes}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
