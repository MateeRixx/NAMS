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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client.get('/customers', { params: { search, limit: 50 } })
      .then((res) => setCustomers(res.data.data.items))
      .finally(() => setLoading(false));
  }, [search]);

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
    <div>
      <h1>Customers</h1>
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
    </div>
  );
}
