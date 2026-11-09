import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Footer from '../components/Footer';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 17000, // Price in Naira
    detail: '1 video per day',
    items: ['Daily short-form video', 'AI script and voiceover', 'Automatic YouTube upload'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 22000,
    detail: '3 videos per day',
    items: ['Everything in Starter', 'Three daily publishing slots', 'Review before posting'],
    featured: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 30000,
    detail: '3 videos per day',
    items: ['Everything in Growth', 'Premium visual clips', 'Multi-channel support'],
  },
];

const faqs = [
  ['Is it safe for my channel?', 'AutoReel uses Google OAuth and requests permissions to read channel details and upload videos. Tokens are encrypted at rest. You can revoke access in your Google Account at any time.'],
  ['Can I cancel anytime?', 'Yes. Subscriptions renew monthly and can be canceled. Access may remain active through the paid billing period.'],
  ['Who owns the videos?', 'You retain ownership of the generated video assets, subject to third-party provider terms and applicable law.'],
  ['Are videos unique across customers?', 'Generation prompts include the connected channel ID as a uniqueness seed. This helps differentiate scripts, but cannot guarantee that no idea or phrase will ever overlap.'],
];

export default function Landing() {
  const [open, setOpen] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function choose(plan) {
    if (!user) {
      navigate('/signup');
      return;
    }
    try {
      const { data } = await api.post('/api/billing/checkout', { plan });
      // Redirect to Paystack Checkout
      window.location.assign(data.url);
    } catch (e) {
      alert(e.response?.data?.error || 'Unable to start checkout. Check your billing setup.');
    }
  }

  return (
    <>
      <main>
        {/* HERO */}
        <section className="hero container">
          <div className="eyebrow"><span className="pulse" /> YOUR CHANNEL. ON AUTOPILOT.</div>
          <h1>Your YouTube channel, posted daily, <span>without you lifting a finger.</span></h1>
          <p className="hero-copy">
            Turn your niche into a consistent publishing engine. AutoReel writes, illustrates,
            narrates, edits, and schedules faceless videos for your YouTube channel.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/signup">Get started free <span>↗</span></Link>
            <a className="btn btn-secondary" href="#pricing">See pricing</a>
          </div>
          <div className="hero-proof">
            <span>✦ AI-assisted production</span>
            <span>↗ Automated publishing</span>
            <span>◉ Review when you want</span>
          </div>
          <div className="hero-visual">
            <div className="visual-glow" />
            <div className="video-preview">
              <div className="preview-top">
                <span className="live-dot" /> AUTO-REEL STUDIO <span className="preview-tag">9:16</span>
              </div>
              <div className="preview-art">
                <div className="art-sun" />
                <div className="art-hill hill-one" />
                <div className="art-hill hill-two" />
                <div className="art-person"><i /><b /><em /></div>
                <div className="art-caption">SMALL STEPS.<br />BIG MOMENTUM.</div>
              </div>
              <div className="preview-bottom">
                <div><strong>Today's content</strong><small>Ready for your channel</small></div>
                <span className="ready-pill">● Ready</span>
              </div>
            </div>
            <div className="float-card float-left">
              <span className="float-icon">✦</span>
              <div><strong>Script complete</strong><small>Original narration</small></div>
            </div>
            <div className="float-card float-right">
              <span className="float-icon">↗</span>
              <div><strong>Scheduled</strong><small>Tomorrow · 8:00 AM</small></div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section container" id="how">
          <div className="section-heading">
            <span className="eyebrow">SIMPLE BY DESIGN</span>
            <h2>From idea to upload in <span>three steps.</span></h2>
            <p>Set your direction once. AutoReel handles the repetitive production work.</p>
          </div>
          <div className="steps-grid">
            {[
              ['01', 'Connect your channel', 'Securely connect your YouTube channel with Google OAuth.'],
              ['02', 'Choose your niche & style', 'Set your topic, visual style, voice, language, and review preferences.'],
              ['03', 'Wake up to new videos', 'Your videos are generated and uploaded on your schedule, subject to review settings.'],
            ].map((s) => (
              <article className="step-card" key={s[0]}>
                <span className="step-number">{s[0]}</span>
                <h3>{s[1]}</h3>
                <p>{s[2]}</p>
                <span className="step-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        {/* SAMPLES */}
        <section className="section sample-section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">MADE FOR SHORT-FORM</span>
              <h2>Stories built for the <span>vertical screen.</span></h2>
              <p>Replace these sample embeds with videos from your own channel.</p>
            </div>
            <div className="samples-grid">
              {['M7lc1UVf-VE', 'ysz5S6PUM-U', 'ScMzIvxBSi4'].map((id, i) => (
                <div className="sample-card" key={id}>
                  <div className="sample-label">SAMPLE 0{i + 1}</div>
                  <iframe
                    title={`Sample video ${i + 1}`}
                    src={`https://www.youtube.com/embed/${id}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  <p>{['Ideas that spark curiosity', 'Small lessons, lasting impact', 'Stories worth sharing'][i]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section container" id="pricing">
          <div className="section-heading">
            <span className="eyebrow">CLEAR, MONTHLY PRICING</span>
            <h2>Choose your <span>publishing pace.</span></h2>
            <p>Plans activate only after Paystack confirms your subscription payment.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((p) => (
              <article className={`price-card ${p.featured ? 'highlighted' : ''}`} key={p.id}>
                {p.featured && <div className="popular-ribbon">MOST POPULAR</div>}
                <div className="plan-name">{p.name}</div>
                <div className="price"><sup>₦</sup>{p.price.toLocaleString()}<span>/month</span></div>
                <p className="plan-detail">{p.detail}</p>
                <ul>
                  {p.items.map((x) => (
                    <li key={x}><span>✓</span>{x}</li>
                  ))}
                </ul>
                <button
                  className={`btn ${p.featured ? 'btn-primary' : 'btn-secondary'} full-btn`}
                  onClick={() => choose(p.id)}
                >
                  Choose plan <span>↗</span>
                </button>
                <small className="plan-note">Monthly subscription · Cancel anytime</small>
              </article>
            ))}
          </div>
          <p className="pricing-footnote">
            AI provider usage, YouTube quota limits, and third-party terms apply. Publishing
            frequency depends on successful generation and upload.
          </p>
        </section>

        {/* FAQ */}
        <section className="section faq-section">
          <div className="container faq-layout">
            <div className="section-heading">
              <span className="eyebrow">GOOD QUESTIONS</span>
              <h2>Before you <span>press publish.</span></h2>
              <p>Clear answers about access, content, and billing.</p>
            </div>
            <div className="faq-list">
              {faqs.map(([q, a], i) => (
                <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={q}>
                  <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                    <span>{q}</span><b>{open === i ? '−' : '+'}</b>
                  </button>
                  {open === i && <p>{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="container final-cta">
          <div>
            <span className="eyebrow">YOUR NEXT VIDEO STARTS HERE</span>
            <h2>Ready to grow on <span>autopilot?</span></h2>
            <p>Build a publishing habit without building every video by hand.</p>
          </div>
          <Link className="btn btn-primary" to="/signup">Start with AutoReel ↗</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}