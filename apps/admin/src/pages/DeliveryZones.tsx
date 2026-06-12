import { useEffect, useState } from 'react';
import client from '../api/client';

interface Zone {
  id: string;
  name: string;
  description: string | null;
  monthlyCharge: number;
  createdAt: string;
}

export default function DeliveryZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/delivery-zones')
      .then((res) => setZones(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Delivery Zones</h1>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Monthly Charge</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td><strong>{z.name}</strong></td>
                <td>{z.description ?? '-'}</td>
                <td>₹{z.monthlyCharge.toFixed(2)}</td>
                <td>{new Date(z.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
