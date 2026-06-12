import { useEffect, useState } from 'react';
import client from '../api/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  billingMonth: number;
  billingYear: number;
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);

  useEffect(() => {
    client.get('/customer-portal/invoices')
      .then((res) => setInvoices(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  async function downloadPdf(id: string) {
    try {
      const res = await client.get(`/customer-portal/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF');
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Invoices</h1>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>No invoices yet</p>
          <p className="hint">Invoices will appear here once generated</p>
        </div>
      ) : (
        <div>
          {invoices.map((inv) => (
            <div key={inv.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === inv.id ? null : inv)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(inv.billingYear, inv.billingMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>₹{Number(inv.totalAmount).toFixed(2)}</div>
                  <span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span>
                </div>
              </div>

              {selected?.id === inv.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div className="profile-field">
                    <span className="label">Subtotal</span>
                    <span className="value">₹{Number(inv.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="profile-field">
                    <span className="label">Delivery Charges</span>
                    <span className="value">₹{Number(inv.deliveryCharges).toFixed(2)}</span>
                  </div>
                  {Number(inv.discountAmount) > 0 && (
                    <div className="profile-field">
                      <span className="label">Discount</span>
                      <span className="value" style={{ color: 'var(--success)' }}>-₹{Number(inv.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="profile-field">
                    <span className="label">Tax</span>
                    <span className="value">₹{Number(inv.taxAmount).toFixed(2)}</span>
                  </div>
                  <div className="profile-field">
                    <span className="label">Total</span>
                    <span className="value" style={{ fontWeight: 700 }}>₹{Number(inv.totalAmount).toFixed(2)}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); downloadPdf(inv.id); }}>
                      Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
