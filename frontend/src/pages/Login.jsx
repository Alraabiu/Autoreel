import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to log in. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Pick up where <span>you left off.</span></h1>
        <p>Sign in to manage your videos and channel.</p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary full-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          New to AutoReel? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}