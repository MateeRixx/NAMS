import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { SkeletonList } from '../components/Skeleton';

interface Product {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  description: string | null;
  estimatedMonthlyCost: number;
  dayRates: { dayOfWeek: number; price: number }[];
}

export default function Products() {
  const { t } = useLanguage();
  const { items, addItem, removeItem, itemCount } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [prodRes, subRes] = await Promise.all([
        client.get('/customer-portal/products'),
        client.get('/customer-portal/subscriptions'),
      ]);
      setProducts(prodRes.data.data);
      setSubscriptions(subRes.data.data.map((s: { productId: string }) => s.productId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <SkeletonList count={3} />;

  const tr = t();

  return (
    <div>
      <div className="page-header">
        <h1>{tr.products_title}</h1>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>{tr.products_empty}</p>
          <p className="hint">{tr.products_empty_hint}</p>
        </div>
      ) : (
        <>
          {products.map((p) => {
            const isSubscribed = subscriptions.includes(p.id);
            const inCart = items.some((i) => i.productId === p.id);

            return (
              <div key={p.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="card-title">{p.name}</div>
                    <div className="card-subtitle">
                      {p.type.replace(/_/g, ' ')}
                      {p.description && <> &middot; {p.description}</>}
                    </div>
                  </div>
                  <div className="card-price">
                    ₹{p.estimatedMonthlyCost.toFixed(2)}<span className="price-unit">{tr.subs_month}</span>
                  </div>
                </div>

                {p.dayRates.length > 0 && (
                  <div className="text-xs text-muted mt-2">
                    Day-specific pricing: {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => {
                      const dr = p.dayRates.find((r) => r.dayOfWeek === i);
                      return dr ? `${d} ₹${dr.price.toFixed(2)}` : null;
                    }).filter(Boolean).join(', ')}
                  </div>
                )}

                <div className="mt-3">
                  {isSubscribed ? (
                    <span className="badge badge-active">{tr.subscribed}</span>
                  ) : (
                    <button
                      className={`btn ${inCart ? 'btn-block' : 'btn-primary btn-block'}`}
                      onClick={() => inCart ? removeItem(p.id) : addItem({ productId: p.id, productName: p.name, basePrice: p.basePrice, estimatedMonthlyCost: p.estimatedMonthlyCost })}
                    >
                      {inCart ? tr.remove_from_cart : tr.add_to_cart}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {itemCount > 0 && (
            <button className="floating-cart-btn" onClick={() => navigate('/cart')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {tr.nav_cart} ({itemCount})
            </button>
          )}
        </>
      )}
    </div>
  );
}
