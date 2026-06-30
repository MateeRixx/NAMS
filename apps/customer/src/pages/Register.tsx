import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string })?.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>(initialEmail ? 'otp' : 'form');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!firstName.trim()) { setError('Enter your first name'); return; }
    if (!lastName.trim()) { setError('Enter your last name'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await register(email, password, firstName.trim(), lastName.trim(), phone.trim() || undefined);
      let msg = result.message ?? 'Account created. Please check your email for the verification OTP.';
      setMessage(msg);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (otp.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      await verifyEmail(email, otp);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page page-enter">
      <div className="login-card">
        <h1>NewsFlow</h1>
        <p className="subtitle">{step === 'form' ? 'Create Account' : 'Verify Email'}</p>

        {step === 'form' ? (
          <>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
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
            {message && <p className="success">{message}</p>}
            <button className="btn btn-primary btn-block" onClick={handleRegister} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </>
        ) : (
          <>
            {message && <p className="success">{message}</p>}
            <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>OTP sent to {email}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary btn-block" onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button className="btn btn-block" onClick={() => { setStep('form'); setOtp(''); setError(''); }} disabled={loading} style={{ marginTop: '0.5rem' }}>
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
