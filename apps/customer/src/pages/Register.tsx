import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, sendEmailOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSendOtp() {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    if (!firstName.trim()) { setError('Enter your first name'); return; }
    if (!lastName.trim()) { setError('Enter your last name'); return; }
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

  async function handleRegister() {
    if (otp.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
    setSending(true);
    setError('');
    try {
      await register(email, otp, firstName.trim(), lastName.trim(), phone.trim() || undefined);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>NewsFlow</h1>
        <p className="subtitle">Create Account</p>

        {step === 'form' ? (
          <>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={100}
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={100}
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={handleSendOtp} disabled={sending}>
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
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
            <button className="btn btn-primary btn-block" onClick={handleRegister} disabled={sending}>
              {sending ? 'Creating account...' : 'Create Account'}
            </button>
            <button className="btn btn-block" onClick={() => { setStep('form'); setOtp(''); setError(''); }} style={{ marginTop: '0.5rem' }}>
              Change Details
            </button>
          </>
        )}

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
