import Link from "next/link";

export const metadata = {
  title: "Subscribe",
  description: "Join Maison Amiral correspondence for collection notes, release announcements and house observations.",
};

export default function SubscribePage() {
  return (
    <main className="subscribe-page">
      <section className="subscribe-hero">
        <div className="subscribe-index">001 / CORRESPONDENCE</div>
        <div className="subscribe-word">STAY<br />CLOSE.</div>
        <div className="subscribe-side-note">
          <span>JOHANNESBURG</span>
          <span>EDITION 001</span>
          <span>HOUSE NOTES</span>
        </div>
      </section>

      <section className="subscribe-content">
        <div className="subscribe-intro">
          <p className="subscribe-kicker">Maison Amiral / Correspondence</p>
          <h1>Notes from the house.</h1>
          <p>
            A quiet line between the studio and the people paying attention. New releases,
            collection notes, editorial studies and occasional observations from Johannesburg.
          </p>
        </div>

        <div className="subscribe-panel">
          <div className="subscribe-panel-meta">
            <span>Frequency</span>
            <strong>Occasional</strong>
            <span>Noise</span>
            <strong>Minimal</strong>
          </div>

          <form className="subscribe-form-main" action="#" method="post">
            <label htmlFor="subscribe-email">Email address</label>
            <div className="subscribe-field">
              <input
                id="subscribe-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ENTER YOUR EMAIL"
                required
              />
              <button type="submit">JOIN →</button>
            </div>
            <p className="subscribe-privacy">
              By subscribing, you agree to receive Maison Amiral correspondence. Read our{" "}
              <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link>.
            </p>
          </form>
        </div>
      </section>

      <section className="subscribe-manifesto">
        <div className="subscribe-manifesto-number">002</div>
        <p>Not a newsletter machine.</p>
        <h2>Only when there is something worth sending.</h2>
        <Link href="/journal">Read the journal ↗</Link>
      </section>
    </main>
  );
}
