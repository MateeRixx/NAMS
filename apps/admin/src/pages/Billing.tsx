import { useEffect, useState } from 'react';
import client from '../api/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/billing/invoices')
      .then((res) => setInvoices(res.data.data))
      .catch((err) => console.error('Billing fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  function downloadPdf(id: string) {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.open(`${base}/billing/invoices/${id}/pdf?token=${token}`, '_blank');
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return <div className="loading">Loading...</div>;

  if (invoices.length === 0) return (
    <div>
      <h1>Invoices</h1>
      <p>No invoices generated yet.</p>
    </div>
  );

  return (
    <div>
      <h1>Invoices</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Period</th>
            <th>Total</th>
            <th>Status</th>
            <th>Generated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="mono">{inv.invoiceNumber}</td>
              <td>{monthNames[inv.billingMonth - 1]} {inv.billingYear}</td>
              <td><strong>₹{Number(inv.totalAmount).toFixed(2)}</strong></td>
              <td><span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
              <td>{new Date(inv.generatedAt).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-sm" onClick={() => downloadPdf(inv.id)}>
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
