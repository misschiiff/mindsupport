"use client";

import { FormEvent, useRef, useState } from "react";
import { Icon } from "./ui-icon";
import { createRequestKey, postPublicApi } from "../lib/api-client";
import { HoneypotField, TurnstileWidget } from "./turnstile-widget";

export function SubscriberSignup({ variant = "card" }: { variant?: "card" | "inline" }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const requestKeyRef = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("subscriber-email") ?? "").trim().toLowerCase();
    const consent = form.get("subscriber-consent") === "on";
    if (!email || !consent) { setError("Enter your email and choose to receive the updates."); return; }
    setError("");
    setIsSubmitting(true);
    const requestKey = requestKeyRef.current ?? createRequestKey();
    requestKeyRef.current = requestKey;
    try {
      await postPublicApi("subscribers", {
        email,
        consent: true,
        source: variant === "inline" ? "reflections_post_submit" : "reflections_feed",
        turnstileToken,
        website: String(form.get("website") ?? ""),
      }, requestKey);
      setDone(true);
      requestKeyRef.current = null;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t save the sign-up. Please try again.");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally { setIsSubmitting(false); }
  }

  return <article className={`subscriber-card subscriber-card-${variant}`}>
    {done ? <div className="subscriber-success" role="status"><span className="subscriber-icon"><Icon name="check" size={19}/></span><div><b>Your sign-up is saved.</b><p>Welcome email delivery and unsubscribe links are not connected yet, so no email has been sent.</p></div></div> : <>
      <span className="section-label">A SMALL NOTE FOR LATER</span>
      <h2>Quiet insights, when you need them.</h2>
      <p>Occasional, grounded reflections to help you pause and check in with yourself.</p>
      <form onSubmit={submit} onChange={() => { if (error) { setError(""); requestKeyRef.current = null; } }}>
        <label className="sr-only" htmlFor={`subscriber-email-${variant}`}>Email address</label>
        <div className="subscriber-input-row"><input id={`subscriber-email-${variant}`} name="subscriber-email" type="email" autoComplete="email" maxLength={254} placeholder="Your email address" required/><button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Send me quiet insights"} {!isSubmitting && <Icon name="arrow" size={16}/>}</button></div>
        <label className="subscriber-consent"><input name="subscriber-consent" type="checkbox" required/><span>I agree to receive occasional Mindsupport insights by email.</span></label>
        <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey}/><HoneypotField/>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <small>No spam. Just quiet, grounded insights. Unsubscribe anytime.</small>
      <small className="subscriber-demo-note">Your sign-up is stored separately from anonymous messages. Welcome email delivery is not active yet.</small>
    </>}
  </article>;
}
