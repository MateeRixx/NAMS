import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const roles = ['AGENCY_ADMIN', 'AGENCY_STAFF'] as const;

interface Agency {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

type Tab = 'profile' | 'staff';

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'AGENCY_STAFF' });
  const [addLoading, setAddLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      client.get(`/agencies/${user.agencyId}`),
      client.get('/auth/users'),
    ])
      .then(([agencyRes, usersRes]) => {
        const a = agencyRes.data.data as Agency;
        setAgency(a);
        setForm({
          name: a.name,
          email: a.email,
          phone: a.phone,
          address: a.address ?? '',
          gstNumber: a.gstNumber ?? '',
          logoUrl: a.logoUrl ?? '',
        });
        setStaff(usersRes.data.data as StaffUser[]);
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await client.patch(`/agencies/${agency.id}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address || undefined,
        gstNumber: form.gstNumber || undefined,
        logoUrl: form.logoUrl || undefined,
      });
      setAgency(res.data.data);
      setSuccess('Agency profile updated');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to update';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <h1>Settings</h1>

      <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${tab === 'profile' ? 'btn-primary' : ''}`}
          onClick={() => setTab('profile')}
        >
          Agency Profile
        </button>
        <button
          className={`btn ${tab === 'staff' ? 'btn-primary' : ''}`}
          onClick={() => setTab('staff')}
        >
          Staff Management
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}
      {success && <div style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{success}</div>}

      {tab === 'profile' && agency && (
        <form onSubmit={handleSave} className="settings-form" style={{ maxWidth: 500 }}>
          <div className="input-group">
            <label>Agency Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="input-group">
            <label>GST Number</label>
            <input className="input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Logo URL</label>
            <input className="input" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
          </div>

          <hr />

          <div className="input-group">
            <label>Agency Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${agency.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                {agency.status}
              </span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={async () => {
                  const newStatus = agency.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                  try {
                    const res = await client.patch(`/agencies/${agency.id}/status`, { status: newStatus });
                    setAgency(res.data.data);
                    setSuccess(`Agency ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
                  } catch {
                    setError('Failed to update status');
                  }
                }}
              >
                {agency.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>

          <hr />

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'staff' && (
        <div>
          <div className="page-actions" style={{ marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowAddStaff(true)}>+ Add Staff</button>
          </div>

          {staff.length === 0 ? (
            <div className="empty">No staff users found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.firstName} {s.lastName}</strong></td>
                    <td>{s.email ?? '-'}</td>
                    <td>{s.phone ?? '-'}</td>
                    <td><span className="badge">{s.role.replace('_', ' ')}</span></td>
                    <td><span className={`badge ${s.isActive ? 'badge-active' : 'badge-inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {showAddStaff && (
            <div className="modal-overlay" onClick={() => setShowAddStaff(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Add Staff User</h2>
                  <button className="modal-close" onClick={() => setShowAddStaff(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>First Name</label>
                    <input className="form-control" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input className="form-control" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input className="form-control" type="text" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select className="select" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                      {roles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  {error && <div className="error-text">{error}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn" onClick={() => setShowAddStaff(false)}>Cancel</button>
                  <button className="btn btn-primary" disabled={addLoading} onClick={async () => {
                    if (!addForm.firstName || !addForm.lastName || !addForm.password) {
                      setError('Name and password are required');
                      return;
                    }
                    if (!addForm.email && !addForm.phone) {
                      setError('Either email or phone is required');
                      return;
                    }
                    setAddLoading(true);
                    setError('');
                    try {
                      const payload: Record<string, string> = {
                        firstName: addForm.firstName,
                        lastName: addForm.lastName,
                        password: addForm.password,
                        role: addForm.role,
                        agencyId: user!.agencyId,
                      };
                      if (addForm.email) payload.email = addForm.email;
                      if (addForm.phone) payload.phone = addForm.phone;
                      await client.post('/auth/register', payload);
                      setShowAddStaff(false);
                      setAddForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'AGENCY_STAFF' });
                      const usersRes = await client.get('/auth/users');
                      setStaff(usersRes.data.data as StaffUser[]);
                      setSuccess('Staff user created');
                    } catch (err: unknown) {
                      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to create user';
                      setError(msg);
                    } finally {
                      setAddLoading(false);
                    }
                  }}>
                    {addLoading ? 'Creating...' : 'Create Staff'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
