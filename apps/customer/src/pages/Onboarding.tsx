import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

interface DeliveryZone {
  id: string;
  name: string;
}

export default function Onboarding() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [floor, setFloor] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    client.get('/customer-portal/delivery-zones')
      .then((res) => setZones(res.data.data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!houseNumber.trim() || !street.trim() || !area.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const zone = zones.find((z) => z.name === area);
      await client.post('/customer-portal/addresses', {
        houseNumber: houseNumber.trim(),
        street: street.trim(),
        floor: floor.trim() || undefined,
        landmark: landmark.trim() || undefined,
        area: area.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        zoneId: zone?.id ?? undefined,
        isPrimary: true,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-page page-enter">
      <div className="login-card" style={{ width: '440px' }}>
        <h1>NewsFlow</h1>
        <p className="subtitle">Complete Your Profile</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Welcome, {user?.firstName}! Please add your delivery address to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" placeholder="House / Flat No" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} style={{ flex: 1 }} required />
            <input type="text" placeholder="Floor" value={floor} onChange={(e) => setFloor(e.target.value)} style={{ flex: 1 }} />
          </div>
          <input type="text" placeholder="Street / Colony" value={street} onChange={(e) => setStreet(e.target.value)} required />
          <input type="text" placeholder="Landmark (optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
          <div className="form-row">
            <select value={area} onChange={(e) => setArea(e.target.value)} style={{ flex: 1 }} required>
              <option value="">-- Select Area --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
            </select>
            <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ flex: 1 }} required />
          </div>
          <div className="form-row">
            <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} style={{ flex: 1 }} required />
            <input type="text" placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} style={{ flex: 1 }} required />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button className="btn btn-sm" onClick={logout}>Logout</button>
        </p>
      </div>
    </div>
  );
}
