import { useEffect, useState } from 'react';
import client from '../api/client';

interface Address {
  id: string;
  zoneId: string | null;
  houseNumber: string;
  street: string;
  landmark: string | null;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  isPrimary: boolean;
}

interface Customer {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  productId: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

interface DeliveryZone {
  id: string;
  name: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    zoneId: '', houseNumber: '', street: '', landmark: '', area: '', city: '', state: '', postalCode: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    client.get('/delivery-zones').then((res) => setZones(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: 50 };
    if (search) params.search = search;
    client.get('/customers', { params })
      .then((res) => setCustomers(res.data.data.items))
      .finally(() => setLoading(false));
  }, [search]);

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.phone) {
      setFormError('First name, last name and phone are required');
      return;
    }
    if (!form.houseNumber || !form.street || !form.area || !form.city || !form.state || !form.postalCode) {
      setFormError('Complete address is required for delivery');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const custRes = await client.post('/customers', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
      });
      const customerId = custRes.data.data.id;
      await client.post(`/customers/${customerId}/addresses`, {
        zoneId: form.zoneId || undefined,
        houseNumber: form.houseNumber,
        street: form.street,
        landmark: form.landmark || undefined,
        area: form.area,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        isPrimary: true,
      });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', phone: '', email: '', zoneId: '', houseNumber: '', street: '', landmark: '', area: '', city: '', state: '', postalCode: '' });
      const refreshParams: Record<string, string | number> = { limit: 50 };
      if (search) refreshParams.search = search;
      const res = await client.get('/customers', { params: refreshParams });
      setCustomers(res.data.data.items);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(c: Customer) {
    setEditingCustomer(c);
    setEditForm({ firstName: c.firstName, lastName: c.lastName, phone: c.phone, email: c.email ?? '' });
  }

  async function handleEditSave() {
    if (!editingCustomer) return;
    if (!editForm.firstName || !editForm.lastName || !editForm.phone) {
      setFormError('First name, last name and phone are required');
      return;
    }
    setSavingEdit(true);
    setFormError('');
    try {
      await client.patch(`/customers/${editingCustomer.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        email: editForm.email || undefined,
      });
      setEditingCustomer(null);
      await refreshList();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    setSavingEdit(true);
    setFormError('');
    try {
      await client.delete(`/customers/${id}`);
      setDeletingId(null);
      if (selected === id) setSelected(null);
      await refreshList();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete customer');
    } finally {
      setSavingEdit(false);
    }
  }

  async function refreshList() {
    const params: Record<string, string | number> = { limit: 50 };
    if (search) params.search = search;
    const res = await client.get('/customers', { params });
    setCustomers(res.data.data.items);
  }

  async function selectCustomer(id: string) {
    if (selected === id) { setSelected(null); return; }
    setSelected(id);
    setDetailLoading(true);
    const [addrRes, subRes] = await Promise.all([
      client.get(`/customers/${id}/addresses`),
      client.get('/subscriptions', { params: { customerId: id } }),
    ]);
    setAddresses(addrRes.data.data);
    setSubscriptions(subRes.data.data);
    setDetailLoading(false);
  }

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Customers</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Customer</h3>

          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>First Name *</label>
              <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Last Name *</label>
              <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="input-group">
              <label>Phone *</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+919876543210" />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Address</p>

          <div className="input-group">
            <label>Delivery Zone</label>
            <select className="select" value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
              <option value="">No zone (default charge)</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>House / Flat Number *</label>
              <input className="input" value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} placeholder="e.g. 42, A-101" />
            </div>
            <div className="input-group">
              <label>Landmark</label>
              <input className="input" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Near..." />
            </div>
          </div>

          <div className="input-group">
            <label>Street / Road *</label>
            <input className="input" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="e.g. MG Road, Sector 15" />
          </div>

          <div className="input-group">
            <label>Area / Locality *</label>
            <input className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Indira Nagar" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label>City *</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="input-group">
              <label>State *</label>
              <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Postal Code *</label>
              <input className="input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="6 digits" />
            </div>
          </div>

          {formError && <p className="error-text">{formError}</p>}
          <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name, phone, email or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />
      {loading ? <div className="loading">Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <>
                <tr key={c.id} className={selected === c.id ? 'row-selected' : ''} style={{ cursor: 'pointer' }}>
                  <td>{c.customerCode}</td>
                  <td>{c.firstName} {c.lastName}</td>
                  <td>{c.phone}</td>
                  <td>{c.email ?? '-'}</td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => selectCustomer(c.id)}>
                      {selected === c.id ? 'Close' : 'Details'}
                    </button>
                  </td>
                </tr>
                {selected === c.id && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan={7}>
                      {detailLoading ? <div className="loading">Loading...</div> : (
                        <div className="customer-detail">
                          <div className="detail-section">
                            <h3>Addresses ({addresses.length})</h3>
                            {addresses.length === 0 ? <p className="empty">No addresses</p> : (
                              <div className="address-grid">
                                {addresses.map((a) => (
                                  <div key={a.id} className={`address-card ${a.isPrimary ? 'primary' : ''}`}>
                                    {a.isPrimary && <span className="badge badge-active">Primary</span>}
                                    <p>{a.houseNumber}, {a.street}</p>
                                    {a.landmark && <p className="text-muted">{a.landmark}</p>}
                                    <p>{a.area}, {a.city}, {a.state} - {a.postalCode}</p>
                                    {a.zoneId && <p className="text-muted">Zone: {a.zoneId.slice(0, 8)}...</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="detail-section">
                            <h3>Subscriptions ({subscriptions.length})</h3>
                            {subscriptions.length === 0 ? <p className="empty">No subscriptions</p> : (
                              <table className="table" style={{ boxShadow: 'none' }}>
                                <thead>
                                  <tr>
                                    <th>Product ID</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subscriptions.map((s) => (
                                    <tr key={s.id}>
                                      <td className="mono">{s.productId.slice(0, 8)}...</td>
                                      <td>{new Date(s.startDate).toLocaleDateString()}</td>
                                      <td>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}</td>
                                      <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div className="detail-section" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeletingId(c.id)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {editingCustomer && (
        <div className="modal-overlay" onClick={() => setEditingCustomer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <button className="modal-close" onClick={() => setEditingCustomer(null)}>&times;</button>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>First Name *</label>
                <input className="input" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Last Name *</label>
                <input className="input" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label>Phone *</label>
              <input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Optional" />
            </div>
            {formError && <p className="error-text">{formError}</p>}
            <div className="modal-actions">
              <button className="btn" onClick={() => setEditingCustomer(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Customer</h3>
            <p>This will deactivate the customer and their subscriptions. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDeletingId(null)}>Keep</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deletingId)} disabled={savingEdit}>
                {savingEdit ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
