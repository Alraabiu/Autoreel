import Footer from '../components/Footer';

export default function Terms() {
  return (
    <>
      <main className="legal-page container">
        <span className="eyebrow">THE IMPORTANT DETAILS</span>
        <h1>Terms of <span>Service</span></h1>
        <p className="legal-updated">Last updated: October 22, 2026</p>

        <p>
          These Terms govern your use of AutoReel. By creating an account or using the service,
          you agree to these Terms.
        </p>

        <h2>Accounts and access</h2>
        <p>
          You must provide accurate information, protect your login credentials, and use only
          channels and accounts you are authorized to control. You are responsible for activity
          performed through your account and for reviewing Google's permission screen before
          connecting YouTube.
        </p>

        <h2>Subscriptions and billing</h2>
        <p>
          Paid plans are billed monthly through Stripe and automatically renew until canceled.
          You authorize recurring charges at the selected plan price and applicable taxes. You
          may cancel future renewal through available billing controls or by contacting support.
          Unless required by law or stated otherwise at purchase, payments already made are not
          refundable. A plan activates only after we receive confirmation of payment from Stripe.
        </p>

        <h2>Content ownership and responsibility</h2>
        <p>
          As between you and AutoReel, you retain rights you have in the videos generated for
          your account, subject to third-party terms, licenses, and applicable law. You are
          responsible for reviewing generated content, verifying factual claims, obtaining any
          needed rights, and ensuring that uploads comply with YouTube policies and applicable
          law. AI-generated content may be inaccurate, similar to other material, or unsuitable
          without editing.
        </p>

        <h2>Acceptable use</h2>
        <p>
          You may not use AutoReel to create or distribute unlawful, infringing, deceptive,
          abusive, or otherwise prohibited content; evade platform safeguards; mislead viewers;
          or interfere with the service. We may suspend accounts involved in abuse, fraud, or
          serious policy violations.
        </p>

        <h2>Third-party services and availability</h2>
        <p>
          AutoReel relies on third-party services including Google, YouTube, Stripe, and AI
          providers. Availability, upload limits, costs, and functionality may change. We do
          not guarantee a particular number of successful uploads, views, subscribers, revenue,
          or channel growth.
        </p>

        <h2>Disclaimer and limitation of liability</h2>
        <p>
          The service is provided "as is" and "as available" to the maximum extent permitted by
          law. To the maximum extent permitted by law, AutoReel is not liable for indirect,
          incidental, special, consequential, or punitive damages, lost profits, lost data,
          channel restrictions, or third-party service interruptions. Nothing in these Terms
          excludes liability that cannot lawfully be excluded.
        </p>

        <h2>Changes and contact</h2>
        <p>
          We may update these Terms from time to time. Continued use after updated Terms take
          effect constitutes acceptance where permitted by law. Contact{' '}
          <a href="mailto:support@autoreel.app">support@autoreel.app</a> for questions.
        </p>
      </main>
      <Footer />
    </>
  );
}