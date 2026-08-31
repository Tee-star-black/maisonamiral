"use client";

import { FormEvent, useState } from "react";

export function SubscribeForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const firstName = String(formData.get("firstName") || "").trim();

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error || "Unable to subscribe.");

      setStatus("success");
      setMessage(payload.message || "House Correspondence is active.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to subscribe.");
    }
  }

  return (
    <form className="subscribe-form-main" onSubmit={handleSubmit}>
      <div className="subscribe-name-field">
        <label htmlFor="subscribe-first-name">First name <span>Optional</span></label>
        <input id="subscribe-first-name" name="firstName" type="text" autoComplete="given-name" placeholder="YOUR NAME" maxLength={80} />
      </div>

      <label htmlFor="subscribe-email">Email address</label>
      <div className="subscribe-field">
        <input id="subscribe-email" name="email" type="email" autoComplete="email" placeholder="ENTER YOUR EMAIL" required />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "JOINING…" : status === "success" ? "JOINED ✓" : "JOIN →"}
        </button>
      </div>

      {message ? (
        <p className={`subscribe-status ${status === "error" ? "is-error" : "is-success"}`} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
