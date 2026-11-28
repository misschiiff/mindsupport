"use client";

import { FormEvent, useRef, useState } from "react";
import { Icon } from "./ui-icon";
import { validateAnonymousMessage } from "../lib/form-validation.mjs";
import { createRequestKey, postPublicApi } from "../lib/api-client";
import { SubscriberSignup } from "./subscriber-signup";
import { HoneypotField, TurnstileWidget } from "./turnstile-widget";

export function MessageForm({ source = "Anonymous website" }: { source?: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const requestKeyRef = useRef<string | null>(null);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const data = new FormData(event.currentTarget);
    const validationError = validateAnonymousMessage({ message: data.get("message"), publishConsent: data.get("publish") });
    if (validationError) { setError(validationError); return; }
    setIsSubmitting(true);
    setError("");
    const requestKey = requestKeyRef.current ?? createRequestKey();
    requestKeyRef.current = requestKey;
    try {
      await postPublicApi("messages", {
        text: String(data.get("message") ?? "").trim(),
        publishConsent: true,
        source: source.slice(0, 80),
        turnstileToken,
        website: String(data.get("website") ?? ""),
      }, requestKey);
      setSent(true);
      requestKeyRef.current = null;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t send your message. Please try again.");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally { setIsSubmitting(false); }
  }
  if (sent) return <div className="message-success-wrap"><div className="success-card message-success" role="status"><span className="success-mark"><Icon name="check" size={27}/></span><div className="section-label">A FIRST STEP, RECEIVED</div><h2>Your message is safe<br/><em>with us.</em></h2><p>Your anonymous message has been securely received and queued for review. Only an approved reflection will appear publicly.</p><p className="form-privacy"><Icon name="shield" size={16}/> Your email and subscriber choices are not connected to this message.</p><button className="button button-light" onClick={() => setSent(false)}>Send another message</button></div><div className="message-next-step"><div className="section-label">IF A SMALL PAUSE WOULD HELP</div><h2>A gentle reflection for later.</h2><p>Receive occasional, grounded prompts by email. This choice is separate from your anonymous message.</p><SubscriberSignup variant="inline"/></div></div>;
  return <form className="message-form" onSubmit={handleSubmit} noValidate onChange={() => { if (error) setError(""); }}>
    <label className="field-label" htmlFor="message">Your message <span>*</span></label>
    <textarea id="message" name="message" rows={7} maxLength={2000} required placeholder="You can start with a feeling, a question, or simply: I’m not sure where to begin…"/>
    <p className="message-helper">Please don’t include names or details that could identify you or someone else.</p>
    <label className="consent message-consent"><input type="checkbox" name="publish" required/><span>I understand my anonymous message may be shared publicly to encourage others.</span></label>
    <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey}/><HoneypotField/>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button button-light form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending securely…" : "Send anonymous message"} {!isSubmitting && <Icon name="arrow"/>}</button>
    <p className="form-privacy"><Icon name="shield" size={16}/> Your message is stored without your name, email address, or IP address. Subscriber sign-ups are stored separately.</p>
  </form>;
}
