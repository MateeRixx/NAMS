import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../api/client';

export default function PaymentConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<{ invoiceNumber: string; totalAmount: number; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    client.get(`/customer-portal/invoices/${id}`).then((res) => {
      setInvoice(res.data.data);
    }).catch(() => {
      setError('Failed to load invoice details');
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;

  if (error) return (
    <div className="confirmation-card page-enter">
      <h2>Something went wrong</h2>
      <p className="text-muted mt-2">{error}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={() => navigate('/invoices')}>
          View Invoices
        </button>
      </div>
    </div>
  );

  return (
    <div className="confirmation-card page-enter">
      <div className="confirmation-icon">&#10003;</div>
      <h2>Payment Successful!</h2>
      {invoice && (
        <p className="text-muted mt-2">
          Invoice <strong>{invoice.invoiceNumber}</strong> of <strong>₹{invoice.totalAmount.toFixed(2)}</strong> has been paid.
        </p>
      )}
      <p className="text-sm text-muted mt-1">Your subscription is now active.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={() => navigate('/subscriptions')}>
          View Subscriptions
        </button>
        <button className="btn" onClick={() => navigate('/')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
