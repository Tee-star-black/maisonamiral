"use client";

import { useState, type FormEvent } from "react";
import styles from "./more-to-come.module.css";

export function MoreToCome() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setStatus("error");
      setFeedback("Please agree to receive Maison Amiral updates.");
      return;
    }
    setPending(true);
    setStatus("idle");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, website }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to subscribe right now.");
      setEmail("");
      setConsent(false);
      setStatus("success");
      setFeedback("You're on the list. We'll be in touch when the next release is ready.");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Unable to subscribe right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="more-to-come-title">
      <div className={styles.overline}>
        <span>MAISON AMIRAL / WHAT&apos;S NEXT</span>
        <span>EDITION 002 AND BEYOND</span>
      </div>
      <div className={styles.layout}>
        <div>
          <p className={styles.kicker}>05 / THE NEXT CHAPTER</p>
          <h2 id="more-to-come-title">More <em>To Come.</em></h2>
        </div>
        <div className={styles.content}>
          <h3>Future pieces are being prepared.</h3>
          <p>If you are interested in future Maison Amiral releases, enter your email to receive early access, private updates, and drop notifications.</p>
          <form onSubmit={submit} className={styles.form}>
            <label htmlFor="ma-release-email">Email address</label>
            <div className={styles.inputRow}>
              <input id="ma-release-email" name="email" type="email" required
                autoComplete="email" maxLength={254}
                placeholder="YOUR EMAIL ADDRESS"
                value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="submit" disabled={pending}>{pending ? "ADDING..." : "NOTIFY ME"} <span aria-hidden="true">↗</span></button>
            </div>
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor="ma-release-website">Website</label>
              <input id="ma-release-website" type="text" tabIndex={-1} autoComplete="off"
                value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent}
                onChange={(event) => setConsent(event.target.checked)} required />
              <span>I agree to receive release announcements and updates by email. You may opt out of future updates.</span>
            </label>
            {status !== "idle" && <p className={status === "success" ? styles.success : styles.error}
              role={status === "error" ? "alert" : "status"}>{feedback}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
