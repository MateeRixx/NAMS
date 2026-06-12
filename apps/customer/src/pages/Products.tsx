import { useEffect, useState } from 'react';
import client from '../api/client';

interface Product {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  description: string | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [prodRes, subRes] = await Promise.all([
        client.get('/customer-portal/products'),
        client.get('/customer-portal/subscriptions'),
      ]);
      setProducts(prodRes.data.data);
      setSubscriptions(subRes.data.data.map((s: { productId: string; status: string }) => s.productId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubscribe(productId: string) {
    setSubscribing(productId);
    setMsg('');
    try {
      await client.post('/customer-portal/subscriptions', { productId });
      setMsg('Subscribed successfully!');
      await load();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Available Products</h1>
      </div>

      {msg && (
        <div className="card" style={{ background: msg.includes('success') ? '#d1fae5' : '#fee2e2', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {msg}
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products available yet</p>
          <p className="hint">Contact your agency to add products</p>
        </div>
      ) : (
        <div>
          {products.map((p) => {
            const isSubscribed = subscriptions.includes(p.id);
            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {p.type.replace(/_/g, ' ')}
                      {p.description && <> &middot; {p.description}</>}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{p.basePrice.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>per day</div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  {isSubscribed ? (
                    <span className="badge badge-active">Subscribed</span>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => handleSubscribe(p.id)}
                      disabled={subscribing === p.id}
                    >
                      {subscribing === p.id ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
