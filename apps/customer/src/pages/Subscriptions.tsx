import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { SkeletonList } from '../components/Skeleton';
import MsgBanner from '../components/MsgBanner';

interface Pause {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface Subscription {
  id: string;
  productName: string;
  productType: string;
  basePrice: number;
  startDate: string;
  endDate: string | null;
  status: string;
  pauses: Pause[];
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function monthlyCost(basePrice: number): number {
  return Math.round(basePrice * daysInMonth(new Date()) * 100) / 100;
}

function nextBillingDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Subscriptions() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [genMsg, setGenMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pauseModal, setPauseModal] = useState<{ id: string; start: string; end: string; reason: string } | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await client.get('/customer-portal/subscriptions');
      setSubscriptions(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleGenerateInvoice() {
    setProcessing(true);
    setGenMsg('');
    try {
      const res = await client.post('/customer-portal/invoices/generate-current');
      const inv = res.data.data;
      setGenMsg(t().subs_gen_success.replace('{number}', inv.invoiceNumber).replace('{amount}', inv.totalAmount.toFixed(2)));
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error;
      setGenMsg(apiErr?.message || (err instanceof Error ? err.message : t().subs_error));
    } finally {
      setProcessing(false);
    }
  }

  async function handlePause() {
    if (!pauseModal) return;
    setProcessing(true);
    try {
      await client.patch(`/customer-portal/subscriptions/${pauseModal.id}/pause`, {
        startDate: pauseModal.start, endDate: pauseModal.end, reason: pauseModal.reason || undefined,
      });
      setPauseModal(null);
      await load();
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel(id: string) {
    setProcessing(true);
    try {
      await client.patch(`/customer-portal/subscriptions/${id}/cancel`);
      setCancelId(null);
      await load();
    } finally {
      setProcessing(false);
    }
  }

  async function handleResume(id: string) {
    setProcessing(true);
    try {
      await client.patch(`/customer-portal/subscriptions/${id}/resume`);
      await load();
    } finally {
      setProcessing(false);
    }
  }

  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const totalMonthly = activeSubs.reduce((sum, s) => sum + monthlyCost(s.basePrice), 0);

  if (loading) return <SkeletonList count={3} />;

  const tr = t();

  return (
    <div>
      <div className="page-header">
        <h1>{tr.subs_title}</h1>
      </div>

      {genMsg && <MsgBanner msg={genMsg} onDismiss={() => setGenMsg('')} />}

      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <p>{tr.subs_empty}</p>
          <p className="hint">{tr.subs_empty_hint}</p>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>{tr.cart_browse}</button>
        </div>
      ) : (
        <>
          {activeSubs.length > 0 && (
            <div className="card card-billing">
              <div className="font-semibold">{tr.subs_billing_title}</div>
              <div className="text-sm mt-1">
                {tr.subs_next_invoice} <strong>{nextBillingDate()}</strong>
              </div>
              <div className="text-sm">
                {tr.subs_est_total} <strong>₹{totalMonthly.toFixed(2)}</strong>
                <span className="text-xs text-muted"> ({tr.subs_product_only})</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {tr.subs_auto_renew}
              </div>
              <button className="btn btn-sm btn-primary mt-2" onClick={handleGenerateInvoice} disabled={processing}>
                {processing ? tr.subs_generating : tr.subs_gen_invoice}
              </button>
            </div>
          )}

          {subscriptions.map((sub) => (
            <div key={sub.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="card-title">{sub.productName}</div>
                  <div className="card-subtitle">{sub.productType}</div>
                </div>
                <div className="text-right">
                  <span className={`badge badge-${sub.status.toLowerCase()}`}>{sub.status}</span>
                  {sub.status === 'ACTIVE' && (
                    <div className="card-price text-sm mt-1">
                      ₹{monthlyCost(sub.basePrice).toFixed(2)}<span className="price-unit">{tr.subs_month}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted mb-3">
                {tr.subs_started} {new Date(sub.startDate).toLocaleDateString()}
                {sub.endDate && <> &middot; {tr.subs_ends} {new Date(sub.endDate).toLocaleDateString()}</>}
                {!sub.endDate && sub.status === 'ACTIVE' && <> &middot; {tr.subs_auto_renews}</>}
              </div>
              {sub.status === 'ACTIVE' && (
                <div className="action-row">
                  <button className="btn btn-sm" onClick={() => setPauseModal({ id: sub.id, start: '', end: '', reason: '' })}>
                    {tr.subs_pause}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => setCancelId(sub.id)}>{tr.subs_cancel}</button>
                </div>
              )}
              {sub.status === 'PAUSED' && (
                <div className="action-row">
                  <button className="btn btn-sm btn-primary" onClick={() => handleResume(sub.id)} disabled={processing}>
                    {tr.subs_resume}
                  </button>
                </div>
              )}
              {sub.pauses.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm text-muted" style={{ cursor: 'pointer' }}>
                    {tr.subs_pause_history} ({sub.pauses.length})
                  </summary>
                  <div className="mt-2 text-sm">
                    {sub.pauses.map((p) => (
                      <div key={p.id} className="text-muted" style={{ padding: '0.25rem 0' }}>
                        {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                        {p.reason && <> ({p.reason})</>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </>
      )}

      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{tr.subs_confirm_cancel_title}</h3>
            <p className="text-sm">{tr.subs_confirm_cancel_body}</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setCancelId(null)}>{tr.subs_keep}</button>
              <button className="btn btn-danger" onClick={() => handleCancel(cancelId)} disabled={processing}>
                {processing ? tr.subs_cancelling : tr.subs_yes_cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {pauseModal && (
        <div className="modal-overlay" onClick={() => setPauseModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{tr.subs_pause_title}</h3>
            <div className="input-group">
              <label>{tr.subs_pause_start}</label>
              <input className="input" type="date" value={pauseModal.start}
                onChange={(e) => setPauseModal({ ...pauseModal, start: e.target.value })} />
            </div>
            <div className="input-group">
              <label>{tr.subs_pause_end}</label>
              <input className="input" type="date" value={pauseModal.end}
                onChange={(e) => setPauseModal({ ...pauseModal, end: e.target.value })} />
            </div>
            <div className="input-group">
              <label>{tr.subs_pause_reason}</label>
              <input className="input" type="text" placeholder="e.g. Vacation"
                value={pauseModal.reason}
                onChange={(e) => setPauseModal({ ...pauseModal, reason: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setPauseModal(null)}>{tr.subs_modal_cancel}</button>
              <button className="btn btn-primary" onClick={handlePause}
                disabled={processing || !pauseModal.start || !pauseModal.end}>
                {processing ? tr.subs_pausing : tr.subs_pause_confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
