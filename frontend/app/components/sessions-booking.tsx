"use client";

import { FormEvent, useRef, useState } from "react";
import { Icon } from "./ui-icon";
import { createRequestKey, postPublicApi } from "../lib/api-client";
import { HoneypotField, TurnstileWidget } from "./turnstile-widget";

const TIERS = [
  { id: "15-minute", title: "15-minute first conversation", durationMinutes: 15, description: "A gentle introduction to share what you’re looking for and ask questions." },
  { id: "2-hour", title: "2-hour session", durationMinutes: 120, description: "A longer session with time to slow down and work through more together." },
  { id: "5-hour", title: "5-hour session", durationMinutes: 300, description: "An extended block of support, arranged with the team around your needs." },
] as const;

export function SessionsBooking() {
  const [selected, setSelected] = useState<(typeof TIERS)[number]["id"]>(TIERS[0].id);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const requestKeyRef = useRef<string | null>(null);
  const tier = TIERS.find((item) => item.id === selected) ?? TIERS[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const formElement = event.currentTarget;
    if (!name || !email || form.get("contactConsent") !== "on") return;
    setIsSubmitting(true);
    setError("");
    const requestKey = requestKeyRef.current ?? createRequestKey();
    requestKeyRef.current = requestKey;
    try {
      await postPublicApi("sessions", {
        name,
        email,
        phone: String(form.get("phone") ?? "").trim(),
        tier: selected,
        format: String(form.get("format") ?? "either"),
        availability: String(form.get("availability") ?? "Flexible"),
        preferredDay: String(form.get("preferredDay") ?? ""),
        contactConsent: true,
        turnstileToken,
        website: String(form.get("website") ?? ""),
      }, requestKey);
      setNotice(`We’ve received your request for a ${tier.title.toLowerCase()}. A confirmation email is on its way. The team will contact you to discuss your needs and agree the next step. Your session is not confirmed until we contact you.`);
      requestKeyRef.current = null;
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
      formElement.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t submit your request. Please try again.");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally { setIsSubmitting(false); }
  }

  return <div className="session-booking-flow">
    <div className="session-tier-grid" role="group" aria-label="Choose a session">
      {TIERS.map((item) => <button key={item.id} type="button" className={`session-tier${selected === item.id ? " selected" : ""}`} aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setNotice(""); setError(""); requestKeyRef.current = null; }}>
        <span className="session-tier-duration">{item.title}</span><strong>{item.durationMinutes} minutes</strong><small>{item.description}</small>
      </button>)}
    </div>
    <form className="session-action-card" onSubmit={submit} onChange={() => { if (error) { setError(""); requestKeyRef.current = null; } }}>
      <h2>Request a {tier.title.toLowerCase()}</h2><p>Share a few details. The team will contact you to understand what you’re looking for and agree the next step with you.</p>
      <label className="field-label" htmlFor="session-name">Your name</label><input id="session-name" name="name" required maxLength={100} autoComplete="name" placeholder="Your name"/>
      <label className="field-label" htmlFor="session-email">Email address</label><input id="session-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/>
      <label className="field-label" htmlFor="session-phone">Phone number <span>Optional</span></label><input id="session-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="A number we can reach you on"/>
      <fieldset className="field-group"><legend className="field-label">What works best for you?</legend><div className="choice-grid"><label className="choice"><input type="radio" name="format" value="online"/><span>Online</span></label><label className="choice"><input type="radio" name="format" value="in-person"/><span>In person</span></label><label className="choice"><input type="radio" name="format" value="either" defaultChecked/><span>Either works</span></label></div></fieldset>
      <label className="field-label" htmlFor="session-availability">When are you usually available?</label><select id="session-availability" name="availability" defaultValue="Flexible"><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekday evenings</option><option>Weekends</option><option>Flexible</option></select>
      <label className="field-label" htmlFor="session-day">A day that tends to work <span>Optional</span></label><select id="session-day" name="preferredDay" defaultValue=""><option value="">No preference</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select>
      <label className="consent"><input name="contactConsent" type="checkbox" required/><span>I agree that Mindsupport may use my contact details to respond to this request.</span></label>
      <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey}/><HoneypotField/>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Sending request…" : "Request this session"} {!isSubmitting && <Icon name="arrow"/>}</button>
      <p className="form-privacy"><Icon name="shield" size={16}/> Your request is sent securely to Mindsupport. No payment is taken here. The team will contact you before a session is confirmed.</p>
    </form>
    {notice && <p className="manager-notice" role="status">{notice}</p>}
  </div>;
}
