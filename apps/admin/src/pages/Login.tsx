import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check credentials.');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>NewsFlow</h1>
        <p className="subtitle">Admin Dashboard</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginTop: '0.5rem' }}
          />
          <p className="hint">Use: admin@newsflow.local / admin123</p>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block">Sign In</button>
        </form>
      </div>
    </div>
  );
}
