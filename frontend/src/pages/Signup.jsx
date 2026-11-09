import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      login(data.token, data.user);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create account. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">START CREATING</span>
        <h1>Make consistency <span>your advantage.</span></h1>
        <p>Create your AutoReel account to get started.</p>
        <form onSubmit={submit}>
          <label>
            Your name
            <input
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
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
            Password <small>(8 characters minimum)</small>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary full-btn" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <small className="legal-note">
          By continuing, you agree to our <Link to="/terms">Terms</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </small>
      </section>
    </main>
  );
}