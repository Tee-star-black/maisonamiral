"use client";

import { FormEvent, useState } from "react";

export function FooterSubscribeForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim();
    setStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Subscription failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <form className="ma-subscribe-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="ma-footer-email">Email address</label>
        <input id="ma-footer-email" name="email" type="email" placeholder="Enter your email" autoComplete="email" required />
        <button type="submit" aria-label="Join House Correspondence" disabled={status === "loading"}>
          {status === "loading" ? "…" : status === "success" ? "✓" : "→"}
        </button>
      </form>
      {status === "success" ? <p className="ma-footer-subscribe-status">HOUSE CORRESPONDENCE / ACTIVE</p> : null}
      {status === "error" ? <p className="ma-footer-subscribe-status is-error">PLEASE TRY AGAIN</p> : null}
    </>
  );
}
