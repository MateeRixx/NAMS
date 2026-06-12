import { useEffect, useState } from 'react';
import client from '../api/client';

interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
}

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/subscriptions')
      .then((res) => setSubs(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Subscriptions</h1>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Product ID</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.customerId.slice(0, 8)}...</td>
                <td className="mono">{s.productId.slice(0, 8)}...</td>
                <td>{new Date(s.startDate).toLocaleDateString()}</td>
                <td>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}</td>
                <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
