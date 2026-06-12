import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, sendOtp } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSendOtp() {
    if (phone.length < 10) { setError('Enter a valid phone number'); return; }
    setSending(true);
    setError('');
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      await sendOtp(formattedPhone);
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
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      await login(formattedPhone, otp);
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

        {step === 'phone' ? (
          <>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
            />
            <p className="hint">You'll receive a 6-digit OTP</p>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={handleSendOtp} disabled={sending}>
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>OTP sent to {phone}</p>
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
            <button className="btn btn-block" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} style={{ marginTop: '0.5rem' }}>
              Change Phone
            </button>
          </>
        )}
      </div>
    </div>
  );
}
