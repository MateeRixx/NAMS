import { useEffect, useState } from 'react';
import client from '../api/client';

interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface DeliveryZone { id: string; name: string; }

const PAGE_SIZE = 20;

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ customerId: '', channel: 'EMAIL', title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
      if (channelFilter) params.set('channel', channelFilter);
      if (areaFilter) params.set('area', areaFilter);
      if (zoneFilter) params.set('zoneId', zoneFilter);
      const [notifRes, custRes, zoneRes] = await Promise.all([
        client.get(`/notifications?${params}`),
        client.get('/customers'),
        client.get('/delivery-zones'),
      ]);
      setNotifications(notifRes.data.data.notifications);
      setTotal(notifRes.data.data.total);
      setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : custRes.data.data.items);
      setZones(zoneRes.data.data);
      const uniqueAreas = [...new Set(
        (custRes.data.data?.items || custRes.data.data || [])
          .filter((c: { addresses?: { area: string }[] }) => c.addresses)
          .flatMap((c: { addresses?: { area: string }[] }) => c.addresses!.map((a) => a.area))
          .filter(Boolean)
      )] as string[];
      setAreas(uniqueAreas);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, channelFilter, areaFilter, zoneFilter]);

  async function handleSend() {
    if (!sendForm.title || !sendForm.message) return;
    setSending(true);
    setMsg('');
    try {
      await client.post('/notifications', sendForm);
      setShowSend(false);
      setSendForm({ customerId: '', channel: 'EMAIL', title: '', message: '' });
      setPage(1);
      await load();
      setMsg('Notification sent');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ animation: 'pageIn 0.25s ease-out' }}>
      <div className="page-header">
        <h1>Notifications</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowSend(!showSend)}>
          {showSend ? 'Cancel' : '+ Send Notification'}
        </button>
      </div>

      {msg && <div className="card" style={{ background: '#d1fae5', marginBottom: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{msg}</div>}

      {showSend && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Send Notification</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Customer</label>
              <select className="select" value={sendForm.customerId} onChange={(e) => setSendForm({ ...sendForm, customerId: e.target.value })}>
                <option value="">All customers (broadcast)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Channel</label>
              <select className="select" value={sendForm.channel} onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value })}>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PUSH">Push</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Title</label>
            <input className="input" value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} placeholder="Notification title" />
          </div>
          <div className="input-group">
            <label>Message</label>
            <textarea className="textarea" value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} placeholder="Notification message" rows={3} />
          </div>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending || !sendForm.title || !sendForm.message}>
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="select" value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
          <option value="">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="PUSH">Push</option>
        </select>
        <select className="select" value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
          <option value="">All Zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select className="select" value={areaFilter} onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
          <option value="">All Areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{total} total</span>
      </div>

      {loading ? <div className="loading">Loading...</div> : notifications.length === 0 ? (
        <div className="empty-state"><p>No notifications</p></div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div key={n.id} className="card" style={{
                borderLeft: n.status === 'PENDING' ? '3px solid var(--primary)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                      {n.channel} &middot; {n.status} &middot; {new Date(n.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span className={`badge badge-${n.status.toLowerCase()}`}>{n.status}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
