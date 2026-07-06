import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { SkeletonList } from '../components/Skeleton';
import MsgBanner from '../components/MsgBanner';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface Estimate {
  items: {
    productId: string;
    productName: string;
    billableDays: number;
    unitPrice: number;
    amount: number;
    startDate: string;
  }[];
  subtotal: number;
  deliveryCharges: number;
  billingCharges: number;
  taxAmount: number;
  totalAmount: number;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export default function Cart() {
  const { items, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const { t, locale } = useLanguage();
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      setEstimate(null);
      setMsg('');
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      // 1. Check subscriptions — remove subscribed items & bail, let next render retry
      try {
        const subRes = await client.get('/customer-portal/subscriptions');
        if (cancelled) return;
        const subscribedIds: string[] = subRes.data.data.map(
          (s: { productId: string }) => s.productId
        );
        const subscribed = items.filter((i) => subscribedIds.includes(i.productId));
        if (subscribed.length > 0) {
          for (const i of subscribed) removeItem(i.productId);
          return; // bail — removeItem triggers re-render, next effect run will try estimate
        }
      } catch {
        /* ignore */
      }

      if (cancelled) return;

      // 2. Fetch estimate with items that are not subscribed
      try {
        const res = await client.post('/customer-portal/cart/estimate', {
          items: items.map((i) => ({ productId: i.productId })),
        });
        if (!cancelled) setEstimate(res.data.data);
      } catch (err: unknown) {
        if (cancelled) return;
        const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error;
        setMsg(apiErr?.message || 'Could not fetch estimate');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleCheckout = useCallback(async () => {
    setCheckingOut(true);
    setMsg('');
    try {
      const res = await client.post('/customer-portal/cart/checkout', {
        items: items.map((i) => ({ productId: i.productId })),
      });
      const { invoiceId, invoice } = res.data.data;
      const invId = invoiceId || invoice?.id;
      if (!invId) {
        setMsg('Checkout complete but no invoice found');
        clearCart();
        return;
      }

      // Initiate payment immediately
      const initRes = await client.post(`/customer-portal/invoices/${invId}/pay`);
      const { orderId, amount, currency, keyId } = initRes.data.data;

      if (!keyId) {
        // Mock payment fallback
        const verifyRes = await client.post(`/customer-portal/invoices/${invId}/verify`, {
          orderId,
          paymentId: `mock_pay_${Date.now()}`,
          signature: 'mock_signature',
        });
        if (verifyRes.data.success) {
          clearCart();
          navigate(`/invoices/${invId}/confirmation`, { replace: true });
        } else {
          setMsg('Payment failed. Try again from Invoices page.');
        }
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'NewsFlow',
        description: `Invoice payment`,
        order_id: orderId,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            await client.post(`/customer-portal/invoices/${invId}/verify`, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            clearCart();
            navigate(`/invoices/${invId}/confirmation`, { replace: true });
          } catch {
            setMsg('Payment verified but could not confirm. Check Invoices page.');
          }
        },
        modal: {
          ondismiss: () => {
            setCheckingOut(false);
          },
        },
        theme: { color: '#3b82f6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error;
      setMsg(apiErr?.message || (err instanceof Error ? err.message : 'Checkout failed'));
      setCheckingOut(false);
    }
  }, [items, clearCart, navigate]);

  const tr = t();

  if (items.length === 0 && !estimate && !loading) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <h1>{tr.cart_empty}</h1>
        </div>
        <div className="empty-state">
          <p>{tr.cart_empty}</p>
          <p className="hint">{tr.cart_hint}</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>
            {tr.cart_browse}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>
          {tr.nav_cart} ({items.length})
        </h1>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => {
            clearCart();
            setEstimate(null);
          }}
        >
          {tr.cart_clear}
        </button>
      </div>

      {msg && <MsgBanner msg={msg} onDismiss={() => setMsg('')} />}

      {items.map((item) => (
        <div key={item.productId} className="card">
          <div className="flex justify-between items-center">
            <div>
              <div className="card-title">{item.productName}</div>
              <div className="text-sm text-muted mt-1">
                ₹{(item.estimatedMonthlyCost || item.basePrice * 30).toFixed(2)}
                <span className="price-unit">/mo</span>
              </div>
            </div>
            <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.productId)}>
              {tr.cart_remove}
            </button>
          </div>
        </div>
      ))}

      {loading && <SkeletonList count={2} />}

      {estimate && (
        <div className="card">
          <div
            className="card-section compact"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '0.75rem' }}
          >
            <div className="font-semibold text-sm" style={{ color: '#166534' }}>
              {tr.prorated_title}
            </div>
            <div className="text-xs mt-1" style={{ color: '#166534' }}>
              {tr.prorated_body
                .replace('{days}', String(estimate.items[0]?.billableDays || 0))
                .replace(
                  '{month}',
                  new Date().toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long' })
                )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h3 style={{ margin: 0 }}>{tr.cart_first_month}</h3>
            <span className="text-xs text-muted">
              {tr.cart_full_month} ₹
              {(
                estimate.subtotal +
                estimate.deliveryCharges +
                estimate.billingCharges +
                estimate.taxAmount
              ).toFixed(2)}
            </span>
          </div>
          <div className="card-section">
            {estimate.items.map((ei) => (
              <div
                key={ei.productId}
                className="flex justify-between text-sm"
                style={{ padding: '0.25rem 0' }}
              >
                <span>
                  {ei.productName} ({ei.billableDays}{' '}
                  {tr.cart_days_left.replace('{s}', ei.billableDays > 1 ? 's' : '')})
                </span>
                <span className="font-medium">₹{ei.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm mt-2" style={{ padding: '0.25rem 0' }}>
              <span>{tr.cart_subtotal}</span>
              <span className="font-medium">₹{estimate.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ padding: '0.25rem 0' }}>
              <span>{tr.cart_delivery}</span>
              <span className="font-medium">₹{estimate.deliveryCharges.toFixed(2)}</span>
            </div>
            {estimate.billingCharges > 0 && (
              <div className="flex justify-between text-sm" style={{ padding: '0.25rem 0' }}>
                <span>{tr.cart_charges}</span>
                <span className="font-medium">₹{estimate.billingCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm" style={{ padding: '0.25rem 0' }}>
              <span>{tr.cart_gst}</span>
              <span className="font-medium">₹{estimate.taxAmount.toFixed(2)}</span>
            </div>
            <div
              className="flex justify-between font-bold"
              style={{
                padding: '0.5rem 0',
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border)',
                fontSize: '1rem',
              }}
            >
              <span>{tr.cart_due_now}</span>
              <span>₹{estimate.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block mt-3"
            onClick={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut
              ? tr.cart_processing
              : tr.cart_pay.replace('{amount}', estimate.totalAmount.toFixed(2))}
          </button>
          <p className="text-xs text-muted text-center mt-2">{tr.cart_sub_note}</p>
        </div>
      )}
    </div>
  );
}
