import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    if (!password) { setError('Enter your password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('Email not verified')) {
        navigate('/register', { state: { email } });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>NewsFlow</h1>
        <p className="subtitle">Customer Portal</p>

        <input
          type="email"
          name="email"
          id="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          New customer? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
