import { useEffect, useState } from 'react';
import client from '../api/client';

interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber?: string;
  amount: number;
  method: string;
  status: string;
  transactionReference: string | null;
  failureReason: string | null;
  attemptCount: number;
  paidAt: string | null;
  createdAt: string;
}

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string | null;
  status: string;
  gatewayRefundId: string | null;
  processedAt: string | null;
  createdAt: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payments' | 'refunds'>('payments');
  const [page, setPage] = useState(1);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const pageSize = 20;

  const [recordForm, setRecordForm] = useState({
    invoiceId: '',
    amount: '',
    method: 'CASH',
    transactionReference: '',
  });

  const [refundForm, setRefundForm] = useState({
    paymentId: '',
    amount: '',
    reason: '',
  });

  const fetchPayments = () => {
    setLoading(true);
    client.get('/payments', { params: { page, pageSize } })
      .then((res) => {
        setPayments(res.data.data.payments);
        setTotalPayments(res.data.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchRefunds = () => {
    setLoading(true);
    client.get('/payments/refunds', { params: { page, pageSize } })
      .then((res) => {
        setRefunds(res.data.data.refunds);
        setTotalRefunds(res.data.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'payments') fetchPayments();
    else fetchRefunds();
  }, [tab, page]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/payments/record', {
        invoiceId: recordForm.invoiceId,
        amount: Number(recordForm.amount),
        method: recordForm.method,
        transactionReference: recordForm.transactionReference || undefined,
      });
      setShowRecordModal(false);
      setRecordForm({ invoiceId: '', amount: '', method: 'CASH', transactionReference: '' });
      fetchPayments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to record payment';
      alert(msg);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/payments/refund', {
        paymentId: refundForm.paymentId,
        amount: Number(refundForm.amount),
        reason: refundForm.reason || undefined,
      });
      setShowRefundModal(false);
      setRefundForm({ paymentId: '', amount: '', reason: '' });
      fetchRefunds();
      fetchPayments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to process refund';
      alert(msg);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      await client.post(`/payments/${paymentId}/retry`);
      setShowRetryModal(false);
      fetchPayments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to retry payment';
      alert(msg);
    }
  };

  const handleRetryAllFailed = async () => {
    try {
      const res = await client.post('/payments/retry-all-failed');
      alert(`Retried ${res.data.data.retried} failed payment(s)`);
      fetchPayments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to retry payments';
      alert(msg);
    }
  };

  const statusBadge = (status: string) => {
    const classMap: Record<string, string> = {
      PAID: 'badge badge-success',
      PENDING: 'badge badge-warning',
      FAILED: 'badge badge-danger',
      REFUNDED: 'badge badge-info',
    };
    return <span className={classMap[status] ?? 'badge'}>{status}</span>;
  };

  const totalPages = Math.ceil((tab === 'payments' ? totalPayments : totalRefunds) / pageSize);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Payments</h1>
        <div className="page-actions">
          <button className="btn btn-sm btn-outline" onClick={handleRetryAllFailed}>
            Retry All Failed
          </button>
          <button className="btn btn-sm" onClick={() => setShowRecordModal(true)}>
            Record Payment
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === 'payments' ? 'active' : ''}`}
          onClick={() => { setTab('payments'); setPage(1); }}
        >
          Payments ({totalPayments})
        </button>
        <button
          className={`tab ${tab === 'refunds' ? 'active' : ''}`}
          onClick={() => { setTab('refunds'); setPage(1); }}
        >
          Refunds ({totalRefunds})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : tab === 'payments' ? (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>{p.invoiceNumber ?? p.invoiceId.slice(0, 8)}</td>
                    <td>{p.customerName ?? p.customerId.slice(0, 8)}</td>
                    <td>₹{p.amount.toFixed(2)}</td>
                    <td>{p.method}</td>
                    <td>{statusBadge(p.status)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.transactionReference?.slice(0, 16) ?? '-'}</td>
                    <td>
                      <div className="btn-group">
                        {p.status === 'PAID' && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedPayment(p);
                              setRefundForm({ paymentId: p.id, amount: String(p.amount), reason: '' });
                              setShowRefundModal(true);
                            }}
                          >
                            Refund
                          </button>
                        )}
                        {p.status === 'FAILED' && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowRetryModal(true);
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={8} className="text-center">No payments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="mx-1">Page {page} of {totalPages}</span>
              <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Gateway Ref</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>{r.paymentId.slice(0, 8)}</td>
                    <td>₹{r.amount.toFixed(2)}</td>
                    <td>{r.reason ?? '-'}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{r.gatewayRefundId?.slice(0, 16) ?? '-'}</td>
                  </tr>
                ))}
                {refunds.length === 0 && (
                  <tr><td colSpan={6} className="text-center">No refunds found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="mx-1">Page {page} of {totalPages}</span>
              <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="btn btn-sm" onClick={() => setShowRecordModal(false)}>x</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Invoice ID</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={recordForm.invoiceId}
                    onChange={(e) => setRecordForm({ ...recordForm, invoiceId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={recordForm.amount}
                    onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Method</label>
                  <select
                    className="form-control"
                    value={recordForm.method}
                    onChange={(e) => setRecordForm({ ...recordForm, method: e.target.value })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={recordForm.transactionReference}
                    onChange={(e) => setRecordForm({ ...recordForm, transactionReference: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowRecordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRefundModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process Refund</h3>
              <button className="btn btn-sm" onClick={() => setShowRefundModal(false)}>x</button>
            </div>
            <form onSubmit={handleProcessRefund}>
              <div className="modal-body">
                <p>Payment: {selectedPayment.invoiceNumber} - ₹{selectedPayment.amount.toFixed(2)}</p>
                <div className="form-group">
                  <label>Refund Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    max={selectedPayment.amount}
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    className="form-control"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowRefundModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm">Process Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRetryModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowRetryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Retry Payment</h3>
              <button className="btn btn-sm" onClick={() => setShowRetryModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <p>Payment: {selectedPayment.invoiceNumber ?? selectedPayment.id.slice(0, 8)}</p>
              <p>Amount: ₹{selectedPayment.amount.toFixed(2)}</p>
              <p>Failure: {selectedPayment.failureReason ?? 'Unknown'}</p>
              <p>Attempt: {selectedPayment.attemptCount}/3</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowRetryModal(false)}>Cancel</button>
              <button type="button" className="btn btn-sm" onClick={() => handleRetryPayment(selectedPayment.id)}>Retry Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
