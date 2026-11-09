import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const initial = {
  niche: '',
  videoStyle: '',
  voiceGender: '',
  voiceTone: '',
  language: 'en',
  avoidTopics: '',
  exampleChannel: '',
  requireReview: true,
};

export default function Onboarding() {
  const [form, setForm] = useState(initial);
  const [channel, setChannel] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [p, d] = await Promise.all([
          api.get('/api/preferences'),
          api.get('/api/dashboard'),
        ]);
        setForm({
          ...initial,
          ...p.data,
          avoidTopics: (p.data.avoidTopics || []).join(', '),
        });
        setChannel(d.data.channel);
      } catch (e) {
        setError(e.response?.data?.error || 'Unable to load your setup.');
      }
    }
    load();
    if (params.get('error')) setError('YouTube connection was not completed. Please try again.');
  }, []);

  async function connect() {
    setError('');
    try {
      const { data } = await api.get('/api/youtube/auth-url');
      window.location.assign(data.url);
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to connect YouTube.');
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put('/api/preferences', {
        ...form,
        avoidTopics: form.avoidTopics
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      });
      setUser((old) => (old ? { ...old, ...data, preferences: data.preferences || data } : old));
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save preferences.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-page container">
      <div className="page-intro">
        <span className="eyebrow">YOUR CHANNEL, YOUR STYLE</span>
        <h1>Set up your <span>creative engine.</span></h1>
        <p>Connect YouTube and tell AutoReel what kind of videos to create.</p>
      </div>

      <section className="panel connect-panel">
        <div className="panel-icon">▶</div>
        <div className="panel-main">
          <h2>Connect your YouTube channel</h2>
          <p>Authorize AutoReel to view your channel and upload videos on your behalf.</p>
          {channel && (
            <div className="connected-channel">
              {channel.thumbnail && <img src={channel.thumbnail} alt="Channel thumbnail" />}
              <div>
                <strong>{channel.title}</strong>
                <small>Channel connected</small>
              </div>
              <span className="status status-posted">Connected</span>
            </div>
          )}
        </div>
        <button className="btn btn-secondary" onClick={connect}>
          {channel ? 'Reconnect channel' : 'Connect with Google'} ↗
        </button>
      </section>

      <form className="panel preferences-form" onSubmit={submit}>
        <div className="panel-heading">
          <span className="eyebrow">CONTENT PREFERENCES</span>
          <h2>Shape your videos</h2>
          <p>All four starred preferences are required before generation can be scheduled.</p>
        </div>

        <div className="form-grid">
          <label>
            Niche *
            <select required value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>
              <option value="">Choose a niche</option>
              <option value="motivation">Motivation</option>
              <option value="tech">Technology</option>
              <option value="facts">Facts</option>
              <option value="history">History</option>
              <option value="stories">Stories</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Video style *
            <select required value={form.videoStyle} onChange={(e) => setForm({ ...form, videoStyle: e.target.value })}>
              <option value="">Choose a style</option>
              <option value="stickman">Stickman</option>
              <option value="cinematic">Cinematic</option>
              <option value="stock_captions">Stock visuals + captions</option>
              <option value="animated_images">Animated images</option>
            </select>
          </label>
          <label>
            Voice gender *
            <select required value={form.voiceGender} onChange={(e) => setForm({ ...form, voiceGender: e.target.value })}>
              <option value="">Choose a voice</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label>
            Voice tone *
            <select required value={form.voiceTone} onChange={(e) => setForm({ ...form, voiceTone: e.target.value })}>
              <option value="">Choose a tone</option>
              <option value="calm">Calm</option>
              <option value="energetic">Energetic</option>
            </select>
          </label>
          <label>
            Video language
            <input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="en" required />
          </label>
          <label>
            Example channel (optional)
            <input value={form.exampleChannel} onChange={(e) => setForm({ ...form, exampleChannel: e.target.value })} placeholder="Channel name or URL" />
          </label>
          <label className="wide-field">
            Topics to avoid (comma-separated)
            <textarea
              rows="3"
              value={form.avoidTopics}
              onChange={(e) => setForm({ ...form, avoidTopics: e.target.value })}
              placeholder="e.g. politics, graphic violence"
            />
          </label>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={form.requireReview}
            onChange={(e) => setForm({ ...form, requireReview: e.target.checked })}
          />
          <span>
            <strong>Review videos before posting</strong>
            <small>Recommended. Generated videos wait for your approval before upload.</small>
          </span>
        </label>

        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving preferences…' : 'Save and continue →'}
        </button>
        <p className="form-hint">
          A paid plan and a connected channel are required to schedule automatic video production.
        </p>
      </form>
    </main>
  );
}