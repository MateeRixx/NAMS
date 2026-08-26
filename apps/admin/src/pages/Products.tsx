import { useEffect, useState } from 'react';
import client from '../api/client';

interface Product {
  id: string;
  name: string;
  type: string;
  frequency: string;
  basePrice: number;
  subscriptionMonthlyPrice: number | null;
  subscriptionYearlyPrice: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface DayRate {
  id: string;
  dayOfWeek: number;
  price: number;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const productTypes = ['NEWSPAPER', 'MAGAZINE', 'BUNDLE'];
const frequencies = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'];

const emptyDayRates: Record<number, string> = { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'NEWSPAPER', frequency: 'DAILY', basePrice: '', subscriptionMonthlyPrice: '', subscriptionYearlyPrice: '', description: '' });
  const [dayRateInputs, setDayRateInputs] = useState<Record<number, string>>({ ...emptyDayRates });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [dayRateProduct, setDayRateProduct] = useState<string | null>(null);
  const [dayRates, setDayRates] = useState<DayRate[]>([]);
  const [rateForm, setRateForm] = useState<Record<number, string>>({});
  const [rateSaving, setRateSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/products');
      setProducts(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name || !form.basePrice) { setFormError('Name and base price are required'); return; }
    setSaving(true);
    setFormError('');
    try {
      const dayRatesPayload = Object.entries(dayRateInputs)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => ({ dayOfWeek: Number(k), price: parseFloat(v) }));
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        frequency: form.frequency,
        basePrice: parseFloat(form.basePrice),
        subscriptionMonthlyPrice: form.subscriptionMonthlyPrice ? parseFloat(form.subscriptionMonthlyPrice) : undefined,
        subscriptionYearlyPrice: form.subscriptionYearlyPrice ? parseFloat(form.subscriptionYearlyPrice) : undefined,
        description: form.description || undefined,
      };
      if (dayRatesPayload.length) payload.dayRates = dayRatesPayload;
      if (editId) {
        await client.patch(`/products/${editId}`, payload);
      } else {
        await client.post('/products', payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', type: 'NEWSPAPER', frequency: 'DAILY', basePrice: '', subscriptionMonthlyPrice: '', subscriptionYearlyPrice: '', description: '' });
      setDayRateInputs({ ...emptyDayRates });
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function startEdit(p: Product) {
    setEditId(p.id);
    setForm({ name: p.name, type: p.type, frequency: p.frequency || 'DAILY', basePrice: String(p.basePrice), subscriptionMonthlyPrice: p.subscriptionMonthlyPrice ? String(p.subscriptionMonthlyPrice) : '', subscriptionYearlyPrice: p.subscriptionYearlyPrice ? String(p.subscriptionYearlyPrice) : '', description: p.description ?? '' });
    try {
      const res = await client.get(`/products/${p.id}/rates`);
      const rates: DayRate[] = res.data.data;
      const dr: Record<number, string> = { ...emptyDayRates };
      rates.forEach((r) => { dr[r.dayOfWeek] = String(r.price); });
      setDayRateInputs(dr);
    } catch {
      setDayRateInputs({ ...emptyDayRates });
    }
    setShowForm(true);
  }

  async function toggleActive(p: Product) {
    try {
      if (p.isActive) {
        await client.patch(`/products/${p.id}/deactivate`);
      } else {
        await client.patch(`/products/${p.id}/activate`);
      }
      await load();
    } catch { /* ignore */ }
  }

  async function openDayRates(productId: string) {
    if (dayRateProduct === productId) { setDayRateProduct(null); return; }
    setDayRateProduct(productId);
    try {
      const res = await client.get(`/products/${productId}/rates`);
      const rates: DayRate[] = res.data.data;
      setDayRates(rates);
      const rf: Record<number, string> = {};
      rates.forEach((r) => { rf[r.dayOfWeek] = String(r.price); });
      setRateForm(rf);
    } catch { setDayRates([]); setRateForm({}); }
  }

  async function saveDayRate(dayOfWeek: number) {
    const price = rateForm[dayOfWeek];
    if (!price) return;
    setRateSaving(true);
    try {
      const existing = dayRates.find((r) => r.dayOfWeek === dayOfWeek);
      if (existing) {
        await client.patch(`/products/${dayRateProduct}/rates/${existing.id}`, { price: parseFloat(price) });
      } else {
        await client.post(`/products/${dayRateProduct}/rates`, { dayOfWeek, price: parseFloat(price) });
      }
      const res = await client.get(`/products/${dayRateProduct}/rates`);
      setDayRates(res.data.data);
    } finally {
      setRateSaving(false);
    }
  }

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', type: 'NEWSPAPER', frequency: 'DAILY', basePrice: '', subscriptionMonthlyPrice: '', subscriptionYearlyPrice: '', description: '' }); setDayRateInputs({ ...emptyDayRates }); }}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editId ? 'Edit Product' : 'New Product'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="input-group">
              <label>Frequency</label>
              <select className="select" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Base Price (₹) *</label>
              <input className="input" type="number" step="0.01" min="0" value={form.basePrice}
                onChange={(e) => {
                  setForm({ ...form, basePrice: e.target.value });
                }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="input-group">
              <label>Subscription Monthly Price (₹)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.subscriptionMonthlyPrice}
                onChange={(e) => setForm({ ...form, subscriptionMonthlyPrice: e.target.value })} placeholder="Optional (for bundles)" />
            </div>
            <div className="input-group">
              <label>Subscription Yearly Price (₹)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.subscriptionYearlyPrice}
                onChange={(e) => setForm({ ...form, subscriptionYearlyPrice: e.target.value })} placeholder="Optional (for bundles)" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="input-group">
              <label>Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Day-wise Prices (optional - overrides base price)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {dayNames.map((name, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{name}</label>
                  <input
                    className="input"
                    style={{ padding: '0.35rem', fontSize: '0.8rem', textAlign: 'center' }}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={form.basePrice || '--'}
                    value={dayRateInputs[idx] ?? ''}
                    onChange={(e) => setDayRateInputs({ ...dayRateInputs, [idx]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : (
        <div>
          {products.map((p) => (
            <div key={p.id} className="card" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {p.type} &middot; {p.frequency} &middot; ₹{p.basePrice.toFixed(2)}/day
                    {p.subscriptionMonthlyPrice && <> &middot; ₹{p.subscriptionMonthlyPrice.toFixed(2)}/month</>}
                    {p.subscriptionYearlyPrice && <> &middot; ₹{p.subscriptionYearlyPrice.toFixed(2)}/year</>}
                    {p.description && <> &middot; {p.description}</>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  <button className="btn btn-sm" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => toggleActive(p)}>{p.isActive ? 'Deactivate' : 'Activate'}</button>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-sm" onClick={() => openDayRates(p.id)}>
                  {dayRateProduct === p.id ? 'Close Day Rates' : 'Day Rates'}
                </button>
              </div>
              {dayRateProduct === p.id && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Day-wise Pricing (override base price)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                    {dayNames.map((name, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{name}</label>
                        <input
                          className="input"
                          style={{ padding: '0.35rem', fontSize: '0.8rem', textAlign: 'center' }}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="--"
                          value={rateForm[idx] ?? ''}
                          onChange={(e) => setRateForm({ ...rateForm, [idx]: e.target.value })}
                        />
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() => saveDayRate(idx)}
                          disabled={rateSaving || !rateForm[idx]}
                        >
                          Set
                        </button>
                      </div>
                    ))}
                  </div>
                  {dayRates.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                      {dayRates.filter((r) => r.price > 0).map((r) => `${dayNames[r.dayOfWeek]}: ₹${r.price}`).join(' | ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && <div className="loading">No products yet. Add your first product.</div>}
        </div>
      )}
    </div>
  );
}
