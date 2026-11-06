"use client";

import { ArrowIcon } from "@/components/ui-icons";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { WheelLoader } from "./wheel-loader";
import styles from "./more-to-come.module.css";

export function MoreToCome() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const successRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "success") successRef.current?.focus({ preventScroll: true });
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
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
      setFeedback("Check your inbox and confirm your email to join the next-drop list.");
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
          <div className={styles.signupStage}>
          {status === "success" ? (
            <div className={styles.successPanel}>
              <div className={styles.successMark} aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" focusable="false">
                  <path className={styles.envelope} d="M7 14h34v24H7z M7 14l17 13 17-13" />
                  <path className={styles.check} d="m16 29 6 6 12-13" />
                </svg>
              </div>
              <p className={styles.successEyebrow}>THE NEXT CHAPTER / ONE STEP AWAY</p>
              <h3 ref={successRef} tabIndex={-1}>Good things are coming.</h3>
              <p>Check your inbox. Confirm your email to unlock early access and future drop announcements.</p>
              <div className={styles.successRule} aria-hidden="true" />
              <button type="button" className={styles.resetButton} onClick={() => {
                setStatus("idle"); setFeedback("");
                requestAnimationFrame(() => emailRef.current?.focus());
              }}>USE ANOTHER EMAIL <ArrowIcon direction="up-right" /></button>
            </div>
          ) : <form onSubmit={submit} className={styles.form} aria-busy={pending}>
            <label htmlFor="ma-release-email">Email address</label>
            <div className={styles.inputRow}>
              <input ref={emailRef} id="ma-release-email" name="email" type="email" required disabled={pending}
                autoComplete="email" maxLength={254}
                placeholder="YOUR EMAIL ADDRESS"
                value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="submit" disabled={pending}>{pending ? <><WheelLoader label="Submitting" compact /> SENDING...</> : "NOTIFY ME"} <span aria-hidden="true"><ArrowIcon direction="up-right" /></span></button>
            </div>
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor="ma-release-website">Website</label>
              <input id="ma-release-website" type="text" tabIndex={-1} autoComplete="off"
                value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent}
                onChange={(event) => setConsent(event.target.checked)} required />
              <span>I agree to receive release announcements and updates by email. Please confirm via the email we send. Every drop email includes an unsubscribe link.</span>
            </label>
            {status === "error" && <p className={styles.error} role="alert">{feedback}</p>}
          </form>}
          </div>
        </div>
      </div>
    </section>
  );
}
