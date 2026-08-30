import Link from "next/link";

export default function SubscribePage() {
  return (
    <main className="subscribe-page">
      <section className="subscribe-shell">
        <p className="si-overline">MAISON AMIRAL / CORRESPONDENCE</p>
        <h1>Stay close.</h1>
        <p className="subscribe-copy">
          Receive collection notes, release announcements and occasional observations from the house.
        </p>
        <form className="subscribe-form" action="#" method="post">
          <label htmlFor="email">Email address</label>
          <div className="subscribe-input-row">
            <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            <button type="submit">Subscribe</button>
          </div>
        </form>
        <Link className="si-cta" href="/journal">Read the journal</Link>
      </section>
    </main>
  );
}
