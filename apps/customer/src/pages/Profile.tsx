import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

interface Address {
  id: string;
  houseNumber: string;
  street: string;
  landmark: string | null;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  isPrimary: boolean;
  zone: { id: string; name: string } | null;
}

const emptyForm = {
  houseNumber: '',
  street: '',
  landmark: '',
  area: '',
  city: '',
  state: '',
  postalCode: '',
  zoneId: '',
  isPrimary: false,
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();

  // Profile
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [deliveryZones, setDeliveryZones] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [addrMsg, setAddrMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      client.get('/customer-portal/addresses'),
      client.get('/customer-portal/delivery-zones'),
    ])
      .then(([addrRes, zoneRes]) => {
        setAddresses(addrRes.data.data);
        setDeliveryZones(zoneRes.data.data);
      })
      .catch(() => setAddrMsg('Failed to load addresses'))
      .finally(() => setLoadingAddr(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg('');
    try {
      await client.patch('/customer-portal/profile', { firstName, lastName, email: email || null });
      setMsg('Profile updated');
      setEditing(false);
      updateUser({ firstName, lastName, email: email || null });
    } catch {
      setMsg('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    setAddrMsg('');
  }

  async function handleAddrSave() {
    setAddrMsg('');
    try {
      if (editId) {
        const res = await client.patch(`/customer-portal/addresses/${editId}`, form);
        setAddresses((prev) =>
          prev.map((a) => (a.id === editId ? { ...a, ...res.data.data, zone: a.zone } : a))
        );
      } else {
        const res = await client.post('/customer-portal/addresses', form);
        setAddresses((prev) => [res.data.data, ...prev]);
      }
      resetForm();
    } catch {
      setAddrMsg('Failed to save address');
    }
  }

  async function handleDelete(id: string) {
    try {
      await client.delete(`/customer-portal/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setShowDeleteConfirm(false);
      setDeleteAddressId(null);
    } catch {
      setAddrMsg('Failed to delete address');
    }
  }

  function startEdit(addr: Address) {
    setForm({
      houseNumber: addr.houseNumber,
      street: addr.street,
      landmark: addr.landmark ?? '',
      area: addr.area,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      zoneId: addr.zone?.id ?? '',
      isPrimary: addr.isPrimary,
    });
    setEditId(addr.id);
    setShowForm(true);
  }

  function addrSummary(a: Address) {
    return [a.houseNumber, a.street, a.landmark, a.area, a.city, a.state, a.postalCode]
      .filter(Boolean)
      .join(', ');
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>My Profile</h1>
        {!editing && (
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      <div className="card">
        {editing ? (
          <>
            <div className="input-group">
              <label>First Name</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {msg && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: msg === 'Profile updated' ? 'var(--success)' : 'var(--danger)',
                  marginBottom: '0.5rem',
                }}
              >
                {msg}
              </p>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="profile-field">
              <span className="label">Name</span>
              <span className="value">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="profile-field">
              <span className="label">Phone</span>
              <span className="value">{user?.phone}</span>
            </div>
            <div className="profile-field">
              <span className="label">Email</span>
              <span className="value">{user?.email ?? 'Not set'}</span>
            </div>
            <div className="profile-field">
              <span className="label">Customer Code</span>
              <span className="value" style={{ fontFamily: 'monospace' }}>
                {user?.customerCode}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Addresses */}
      <div className="section-title">
        <span>Delivery Addresses</span>
        {!showForm && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>{editId ? 'Edit Address' : 'New Address'}</h3>
          <div className="form-row">
            <div className="input-group">
              <label>House / Flat No.</label>
              <input
                className="input"
                value={form.houseNumber}
                onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Street</label>
              <input
                className="input"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Landmark</label>
            <input
              className="input"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>Area</label>
              <input
                className="input"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>City</label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="input-group">
              <label>State</label>
              <input
                className="input"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Postal Code</label>
              <input
                className="input"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Delivery Zone</label>
            <select
              className="select"
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
            >
              <option value="">-- Select Zone --</option>
              {deliveryZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            />
            Set as primary address
          </label>
          {addrMsg && (
            <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
              {addrMsg}
            </p>
          )}
          <div className="modal-actions">
            <button className="btn" onClick={resetForm}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddrSave}>
              {editId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {loadingAddr ? (
        <div className="loading">Loading...</div>
      ) : addresses.length === 0 ? (
        <div className="empty-state">
          <p>No delivery addresses</p>
        </div>
      ) : (
        addresses.map((addr) => (
          <div
            key={addr.id}
            className="card"
            style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem' }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1, fontSize: '0.85rem' }}>
                <div>{addrSummary(addr)}</div>
                <div
                  style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                >
                  {addr.isPrimary && <span className="badge badge-active">Primary</span>}
                  {addr.zone && <span className="badge">{addr.zone.name}</span>}
                </div>
              </div>
              <div className="action-row">
                <button className="btn btn-sm" onClick={() => startEdit(addr)}>
                  Edit
                </button>
                <button
                  className="btn btn-sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => {
                    setDeleteAddressId(addr.id);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="card">
        <button className="btn btn-danger btn-block" onClick={logout}>
          Logout
        </button>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteAddressId && handleDelete(deleteAddressId)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteAddressId(null);
        }}
      />
    </div>
  );
}
