import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <>
      <main className="legal-page container">
        <span className="eyebrow">YOUR DATA MATTERS</span>
        <h1>Privacy <span>Policy</span></h1>
        <p className="legal-updated">Last updated: October 22, 2026</p>

        <p>
          This Privacy Policy explains how AutoReel ("we", "our", or "the service") collects,
          uses, stores, and protects information when you use our video-generation and YouTube
          publishing service.
        </p>

        <h2>Information we collect</h2>
        <p>
          We collect account details such as your name and email address, authentication data
          needed to secure your account, subscription and transaction identifiers supplied by
          Stripe, your content preferences, and information about connected YouTube channels
          (including channel ID, title, and thumbnail). Google OAuth access and refresh tokens
          are encrypted at rest using AES-256-GCM.
        </p>

        <h2>Google API data and use</h2>
        <p>
          When you connect YouTube, we use the permissions shown on Google's consent screen to
          identify your channel and upload videos you direct us to create. We use this data
          only to operate, maintain, and improve the user-requested features. AutoReel's use and
          transfer of information received from Google APIs adheres to the Google API Services
          User Data Policy, including the Limited Use requirements.
        </p>

        <h2>AI providers and service partners</h2>
        <p>
          Video scripts, narration, and image prompts are sent to the AI providers needed to
          generate your videos. Stripe processes subscription payments. We do not sell personal
          data. We share information only with service providers necessary to operate the
          service, to comply with law, or to protect users and the service.
        </p>

        <h2>Retention and security</h2>
        <p>
          We retain account and content data while your account is active and as reasonably
          needed for service delivery, legal obligations, dispute resolution, and enforcement.
          Generated video files may remain in storage until deleted under our retention
          procedures. We use access controls and encryption for OAuth tokens, but no system can
          guarantee absolute security.
        </p>

        <h2>Your choices and revoking access</h2>
        <p>
          You can revoke AutoReel's Google access through your Google Account's third-party
          connections/security settings. Revoking access may stop uploads. To request account
          or data deletion, contact <a href="mailto:support@autoreel.app">support@autoreel.app</a>{' '}
          from your account email. We may need to retain limited records where legally required.
        </p>

        <h2>Children and changes</h2>
        <p>
          AutoReel is not intended for children under 13. We may update this policy and will
          revise the date above when changes take effect.
        </p>

        <h2>Contact</h2>
        <p>Privacy questions: <a href="mailto:support@autoreel.app">support@autoreel.app</a>.</p>
      </main>
      <Footer />
    </>
  );
}