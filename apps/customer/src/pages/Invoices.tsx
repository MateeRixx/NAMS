import { useEffect, useState, useCallback } from 'react';
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
  previousBalance: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/customer-portal/invoices');
      setInvoices(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handlePay = useCallback(async (invoice: Invoice) => {
    setPayingId(invoice.id);
    setMsg('');
    try {
      const initRes = await client.post(`/customer-portal/invoices/${invoice.id}/pay`);
      const { orderId, amount, currency, keyId } = initRes.data.data;

      if (!keyId) {
        const verifyRes = await client.post(`/customer-portal/invoices/${invoice.id}/verify`, {
          orderId,
          paymentId: `mock_pay_${Date.now()}`,
          signature: 'mock_signature',
        });
        if (verifyRes.data.success) {
          setMsg('Payment successful!');
          await load();
        }
        setTimeout(() => setMsg(''), 3000);
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'NewsFlow',
        description: `Invoice ${invoice.invoiceNumber}`,
        order_id: orderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            const verifyRes = await client.post(`/customer-portal/invoices/${invoice.id}/verify`, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              setMsg('Payment successful!');
              await load();
            }
          } catch {
            setMsg('Payment verification failed');
          }
          setTimeout(() => setMsg(''), 3000);
        },
        modal: {
          ondismiss: function () {
            setPayingId(null);
          },
        },
        theme: { color: '#1a56db' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Payment failed');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setPayingId(null);
    }
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Invoices</h1>
      </div>

      {msg && (
        <div className="card" style={{ background: msg.includes('successful') ? '#d1fae5' : '#fee2e2', marginBottom: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          {msg}
        </div>
      )}

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
                  {Number(inv.previousBalance) > 0 && (
                    <div className="profile-field">
                      <span className="label">Previous Balance</span>
                      <span className="value">₹{Number(inv.previousBalance).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="profile-field">
                    <span className="label">Total</span>
                    <span className="value" style={{ fontWeight: 700 }}>₹{Number(inv.totalAmount).toFixed(2)}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); downloadPdf(inv.id); }}>
                      Download PDF
                    </button>
                    {inv.status !== 'PAID' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={(e) => { e.stopPropagation(); handlePay(inv); }}
                        disabled={payingId === inv.id}
                        style={payingId === inv.id ? { opacity: 0.7 } : {}}
                      >
                        {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
                    {inv.status === 'PAID' && (
                      <span className="badge badge-paid" style={{ background: 'var(--success)' }}>Paid</span>
                    )}
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
