import Link from "next/link";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";

export const metadata = {
  title: "Subscribe",
  description: "Join Maison Amiral correspondence for collection notes, release announcements and house observations.",
};

export default function SubscribePage() {
  return (
    <main className="subscribe-page">
      <section className="subscribe-hero">
        <div className="subscribe-index">HOUSE CORRESPONDENCE / 001</div>
        <div className="subscribe-word">SIGNALS<br />FROM THE<br />HOUSE.</div>
        <div className="subscribe-side-note">
          <span>26.2041° S / 28.0473° E</span>
          <span>JOHANNESBURG</span>
          <span>FLAGSHIP / 001</span>
        </div>
        <div className="subscribe-flag-code" aria-hidden="true">AMIRAL / SIGNAL / 001</div>
      </section>

      <section className="subscribe-content">
        <div className="subscribe-intro">
          <p className="subscribe-kicker">Maison Amiral / Correspondence</p>
          <h1>The house writes when it matters.</h1>
          <p>
            Releases, objects, places, process and occasional signals from Johannesburg. No schedule for the sake of having one.
          </p>
          <div className="subscribe-house-code">
            <span>HOUSE</span>
            <strong>AMIRAL</strong>
            <span>EDITION 001 / JHB</span>
          </div>
        </div>

        <div className="subscribe-panel">
          <div className="subscribe-panel-meta">
            <span>Frequency</span>
            <strong>Occasional</strong>
            <span>Signal</span>
            <strong>Direct</strong>
          </div>

          <SubscribeForm />

          <p className="subscribe-privacy">
            By subscribing, you agree to receive Maison Amiral correspondence. Read our{" "}
            <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link>.
          </p>
        </div>
      </section>

      <section className="subscribe-manifesto">
        <div className="subscribe-manifesto-number">DISPATCH / 001</div>
        <p>Not a newsletter machine.</p>
        <h2>Only when there is something worth sending.</h2>
        <div className="subscribe-signature">
          <span>AMIRAL SIGNATURE</span>
          <strong>MAISON AMIRAL</strong>
          <span>JOHANNESBURG / SOUTH AFRICA</span>
        </div>
        <Link href="/journal">Read the journal ↗</Link>
      </section>
    </main>
  );
}
