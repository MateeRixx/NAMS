import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await client.post('/auth/customer/forgot-password', { email });
      setMessage(res.data.data.message);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (otp.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await client.post('/auth/customer/reset-password', { email, otp, password });
      setMessage(res.data.data.message);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>NewsFlow</h1>
        <p className="subtitle">Reset Password</p>

        {step === 'email' && (
          <>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Enter your email to receive a reset OTP.</p>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
            <button className="btn btn-primary btn-block" onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            {message && <p className="success">{message}</p>}
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
            />
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={handleReset} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button className="btn btn-block" onClick={() => { setStep('email'); setOtp(''); setPassword(''); setError(''); setMessage(''); }} style={{ marginTop: '0.5rem' }}>
              Change Email
            </button>
          </>
        )}

        {step === 'done' && (
          <>
            {message && <p className="success">{message}</p>}
            <Link to="/login" className="btn btn-primary btn-block" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Go to Login
            </Link>
          </>
        )}

        <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
