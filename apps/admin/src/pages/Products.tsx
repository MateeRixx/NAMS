import { useEffect, useState } from 'react';
import client from '../api/client';

interface Product {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/products')
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Products</h1>
      {loading ? <div className="loading">Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Base Price</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><span className="badge">{p.type}</span></td>
                <td>₹{p.basePrice.toFixed(2)}</td>
                <td><span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
