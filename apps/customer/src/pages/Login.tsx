import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, sendEmailOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSendOtp() {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setSending(true);
    setError('');
    try {
      await sendEmailOtp(email);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  }

  async function handleLogin() {
    if (otp.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
    setSending(true);
    setError('');
    try {
      await login(email, otp);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>NewsFlow</h1>
        <p className="subtitle">Customer Portal</p>

        {step === 'email' ? (
          <>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="hint">You'll receive a 6-digit OTP via email</p>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={handleSendOtp} disabled={sending}>
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
            <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
              New customer? <Link to="/register">Register here</Link>
            </p>
          </>
        ) : (
          <>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>OTP sent to {email}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={handleLogin} disabled={sending}>
              {sending ? 'Verifying...' : 'Login'}
            </button>
            <button className="btn btn-block" onClick={() => { setStep('email'); setOtp(''); setError(''); }} style={{ marginTop: '0.5rem' }}>
              Change Email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
