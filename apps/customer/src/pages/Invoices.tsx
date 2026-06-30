import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { SkeletonList } from '../components/Skeleton';
import MsgBanner from '../components/MsgBanner';

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
  const { t } = useLanguage();
  const navigate = useNavigate();
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
          orderId, paymentId: `mock_pay_${Date.now()}`, signature: 'mock_signature',
        });
        if (verifyRes.data.success) {
          setMsg(t().payment_successful);
          await load();
        }
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
            await client.post(`/customer-portal/invoices/${invoice.id}/verify`, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            setMsg(t().payment_successful);
            await load();
          } catch {
            setMsg(t().payment_verify_failed);
          }
        },
        modal: { ondismiss: () => setPayingId(null) },
        theme: { color: '#3b82f6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : t().payment_failed);
    }
  }, [t]);

  if (loading) return <SkeletonList count={3} />;

  const tr = t();

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>{tr.invoices_title}</h1>
      </div>

      {msg && <MsgBanner msg={msg} onDismiss={() => setMsg('')} />}

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>{tr.invoices_empty}</p>
          <p className="hint">{tr.invoices_empty_hint}</p>
          <button className="btn btn-primary" onClick={() => navigate('/subscriptions')}>{tr.invoices_view_subs}</button>
        </div>
      ) : (
        <>
          {invoices.map((inv) => (
            <div key={inv.id} className="card clickable" onClick={() => setSelected(selected?.id === inv.id ? null : inv)}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm">{inv.invoiceNumber}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(inv.billingYear, inv.billingMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{Number(inv.totalAmount).toFixed(2)}</div>
                  <span className={`badge badge-${inv.status.toLowerCase()}`}>{inv.status}</span>
                </div>
              </div>

              {selected?.id === inv.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="profile-field">
                    <span className="label">{tr.invoices_label_subtotal}</span>
                    <span className="value">₹{Number(inv.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="profile-field">
                    <span className="label">{tr.invoices_label_delivery}</span>
                    <span className="value">₹{Number(inv.deliveryCharges).toFixed(2)}</span>
                  </div>
                  {Number(inv.discountAmount) > 0 && (
                    <div className="profile-field">
                      <span className="label">{tr.invoices_label_discount}</span>
                      <span className="value" style={{ color: 'var(--success)' }}>-₹{Number(inv.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="profile-field">
                    <span className="label">{tr.invoices_label_tax}</span>
                    <span className="value">₹{Number(inv.taxAmount).toFixed(2)}</span>
                  </div>
                  {Number(inv.previousBalance) > 0 && (
                    <div className="profile-field">
                      <span className="label">{tr.invoices_label_previous}</span>
                      <span className="value">₹{Number(inv.previousBalance).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="profile-field">
                    <span className="label font-bold">{tr.invoices_label_total}</span>
                    <span className="value font-bold">₹{Number(inv.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="action-row mt-3">
                    <button className="btn btn-sm" onClick={async (e) => { e.stopPropagation(); try { await downloadPdf(inv.id); } catch { setMsg('Failed to download PDF'); } }}>
                      {tr.invoices_download}
                    </button>
                    {inv.status !== 'PAID' && (
                      <button className="btn btn-sm btn-primary"
                        onClick={(e) => { e.stopPropagation(); handlePay(inv); }}
                        disabled={payingId === inv.id}>
                        {payingId === inv.id ? tr.invoices_processing : tr.invoices_pay}
                      </button>
                    )}
                    {inv.status === 'PAID' && (
                      <span className="badge badge-paid">{tr.invoices_paid}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
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
    throw new Error('Failed to download PDF');
  }
}
