import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// Updated to Naira
const plans = [
  ['starter', 'Starter', '₦17,000', '1 video/day'],
  ['growth', 'Growth', '₦22,000', '3 videos/day'],
  ['pro', 'Pro', '₦30,000', '3 videos/day + extras'],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/review/pending'),
      ]);
      setData(d.data);
      setPending(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Unable to load dashboard.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkout(plan) {
    setBusy(plan);
    try {
      const { data: d } = await api.post('/api/billing/checkout', { plan });
      // Redirect to Paystack Checkout
      window.location.assign(d.url);
    } catch (e) {
      setError(e.response?.data?.error || 'Checkout could not be started.');
      setBusy('');
    }
  }

  async function review(id, action) {
    setBusy(id);
    try {
      await api.post(`/api/review/${id}/${action}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Review action failed.');
    } finally {
      setBusy('');
    }
  }

  if (!data && !error)
    return (
      <main className="app-page container">
        <div className="page-loading">Loading your dashboard…</div>
      </main>
    );

  return (
    <main className="app-page container">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR CREATOR WORKSPACE</span>
          <h1>Good to see you <span>back.</span></h1>
          <p>Here is how your content engine is doing.</p>
        </div>
        <Link className="btn btn-primary" to="/onboarding">Edit preferences ↗</Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Connected channel</span>
          <div className="stat-main">
            {data?.channel?.thumbnail && (
              <img className="channel-thumb" src={data.channel.thumbnail} alt="" />
            )}
            <strong>{data?.channel?.title || 'Not connected'}</strong>
          </div>
          <small>{data?.channel ? 'YouTube channel linked' : 'Connect a channel in setup'}</small>
        </article>
        <article className="stat-card">
          <span>Current plan</span>
          <div className="stat-main">
            <strong className="capitalize">{data?.plan || 'none'}</strong>
            <span
              className={`status status-${
                data?.subscriptionStatus === 'active'
                  ? 'posted'
                  : data?.subscriptionStatus === 'past_due'
                  ? 'failed'
                  : 'queued'
              }`}
            >
              {data?.subscriptionStatus || 'inactive'}
            </span>
          </div>
          <small>Monthly subscription</small>
        </article>
        <article className="stat-card">
          <span>Videos posted</span>
          <div className="stat-number">{data?.totalPosted ?? 0}</div>
          <small>Successfully uploaded</small>
        </article>
        <article className="stat-card">
          <span>Daily target</span>
          <div className="stat-number">{data?.videosPerDay ?? 0}</div>
          <small>Videos per day</small>
        </article>
      </div>

      {data?.plan === 'none' && (
        <section className="plan-banner">
          <div>
            <h2>Choose a plan to start generating</h2>
            <p>Your plan activates after Paystack confirms payment.</p>
          </div>
          <div className="banner-plans">
            {plans.map((p) => (
              <button
                className="btn btn-secondary"
                key={p[0]}
                disabled={!!busy}
                onClick={() => checkout(p[0])}
              >
                {busy === p[0] ? 'Opening…' : `${p[1]} ${p[2]}`}
              </button>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="panel pending-panel">
          <div className="table-heading">
            <div>
              <span className="eyebrow">YOUR APPROVAL</span>
              <h2>
                Videos waiting for review <span className="count-pill">{pending.length}</span>
              </h2>
            </div>
          </div>
          <div className="review-grid">
            {pending.map((v) => (
              <article className="review-card" key={v._id}>
                <h3>{v.title || 'Generated video'}</h3>
                <p>{v.description}</p>
                <details>
                  <summary>Read script</summary>
                  <p>{v.script}</p>
                </details>
                <div className="review-actions">
                  <button
                    className="btn btn-primary"
                    disabled={!!busy}
                    onClick={() => review(v._id, 'approve')}
                  >
                    {busy === v._id ? 'Saving…' : 'Approve & schedule'}
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={!!busy}
                    onClick={() => review(v._id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel videos-panel">
        <div className="table-heading">
          <div>
            <span className="eyebrow">CONTENT ACTIVITY</span>
            <h2>Recent videos</h2>
          </div>
          <button className="btn btn-secondary btn-small" onClick={load}>↻ Refresh</button>
        </div>
        {!data?.recentVideos?.length ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <h3>Your first video starts here</h3>
            <p>Connect a channel, finish your preferences, and choose a paid plan to begin.</p>
            <Link className="btn btn-secondary" to="/onboarding">Finish setup</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Status</th>
                  <th>Scheduled time</th>
                  <th>YouTube</th>
                </tr>
              </thead>
              <tbody>
                {data.recentVideos.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <strong>{v.title || 'Untitled video'}</strong>
                      {v.error && <small className="row-error">{v.error}</small>}
                    </td>
                    <td><span className={`status status-${v.status}`}>{v.status}</span></td>
                    <td>{v.scheduledTime ? new Date(v.scheduledTime).toLocaleString() : '—'}</td>
                    <td>
                      {v.youtubeVideoId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${v.youtubeVideoId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Watch ↗
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="dashboard-note">
        Automated publishing depends on provider availability and YouTube API quota. Check
        failed items before retrying.
      </p>
    </main>
  );
}