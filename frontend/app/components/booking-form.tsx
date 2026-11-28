"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "./ui-icon";
import { validateBookingStep } from "../lib/form-validation.mjs";
import { createRequestKey, postPublicApi } from "../lib/api-client";
import { HoneypotField, TurnstileWidget } from "./turnstile-widget";

const TOTAL_STEPS = 3;

export function BookingForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const submittingRef = useRef(false);
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (step === 1) return;
    const heading = document.getElementById(`booking-step-${step}-title`);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const validationError = validateBookingStep(step, {
      name: data.get("name"),
      email: data.get("email"),
      format: data.get("format"),
      availability: data.get("availability"),
      consent: data.get("consent"),
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }
    const requestKey = requestKeyRef.current ?? createRequestKey();
    requestKeyRef.current = requestKey;
    try {
      await postPublicApi("free-call", {
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim().toLowerCase(),
        format: String(data.get("format") ?? ""),
        availability: String(data.get("availability") ?? ""),
        preferredDay: String(data.get("date") ?? ""),
        circumstances: data.getAll("circumstances").map(String).filter(Boolean),
        contactConsent: data.get("consent") === "on",
        turnstileToken,
        website: String(data.get("website") ?? ""),
      }, requestKey);
      setError("");
      setSubmitted(true);
      requestKeyRef.current = null;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t submit your request. Please try again.");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  if (submitted) return <div className="success-card" role="status"><span className="success-mark"><Icon name="check" size={27}/></span><div className="section-label">REQUEST RECEIVED</div><h2>Thanks for taking<br/><em>that first step.</em></h2><p>Your request has been recorded and a confirmation email is on its way. The team will contact you to agree a time; no appointment is confirmed until we do.</p><button className="button button-primary" type="button" onClick={() => { setSubmitted(false); setStep(1); setTurnstileToken(""); }}>Back to the form</button></div>;

  return <form className="form-card booking-form" onSubmit={handleSubmit} noValidate onChange={() => { if (error) { setError(""); requestKeyRef.current = null; } }}>
    <div className="form-heading"><span className="step-count" aria-live="polite">Step {step} of {TOTAL_STEPS}</span></div>
    <div className="booking-progress" role="progressbar" aria-label={`Step ${step} of ${TOTAL_STEPS}`} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step}><span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}/></div>
    <p className="form-intro">Request a free 15-minute introductory call.</p>

    <section className="booking-step" hidden={step !== 1} aria-labelledby="booking-step-1-title">
      <h2 id="booking-step-1-title" tabIndex={-1}>How would you<br/>like to meet?</h2>
      <label className="field-label">What works best for you? <span>*</span></label>
      <div className="choice-grid three"><label className="choice"><input type="radio" name="format" value="online"/><span><Icon name="video" size={17}/> Online</span></label><label className="choice"><input type="radio" name="format" value="in-person"/><span><Icon name="pin" size={17}/> In person</span></label><label className="choice"><input type="radio" name="format" value="either"/><span>Either works</span></label></div>
    </section>

    <section className="booking-step" hidden={step !== 2} aria-labelledby="booking-step-2-title">
      <h2 id="booking-step-2-title" tabIndex={-1}>Let’s find a time<br/><em>that works for you.</em></h2>
      <p className="booking-step-copy">Choose a time that usually suits you.</p>
      <label className="field-label" htmlFor="availability">When are you usually available? <span>*</span></label>
      <select id="availability" name="availability" defaultValue=""><option value="" disabled>Choose a time of day</option><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekday evenings</option><option>Weekends</option><option>Flexible</option></select>
      <label className="field-label" htmlFor="date">A day that tends to work <span className="optional">Optional</span></label>
      <select id="date" name="date" defaultValue=""><option value="">No preference</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select>
    </section>

    <section className="booking-step" hidden={step !== 3} aria-labelledby="booking-step-3-title">
      <h2 id="booking-step-3-title" tabIndex={-1}>A few details<br/><em>for your first call.</em></h2>
      <p className="booking-step-copy">Add your name and email so we can arrange your call.</p>
      <label className="field-label" htmlFor="name">What should we call you? <span>*</span></label><input id="name" name="name" autoComplete="name" placeholder="Your name" required/>
      <label className="field-label" htmlFor="email">Where can we reach you? <span>*</span></label><input id="email" name="email" type="email" autoComplete="email" placeholder="Email address" required/>

      <details className="circumstances-details"><summary>Share a little about your circumstances <span>Optional</span></summary><p>Only share what you feel comfortable sharing. This helps the team understand what support may suit you.</p><fieldset><legend>Work or study</legend>{[["Employed", "employed"], ["Self-employed", "self-employed"], ["Studying", "studying"], ["Looking for work", "looking-for-work"], ["Caring for someone", "caring"], ["Retired", "retired"]].map(([label, value]) => <label key={value}><input type="checkbox" name="circumstances" value={value}/><span>{label}</span></label>)}</fieldset><fieldset><legend>Personal circumstances</legend>{[["Single", "single"], ["Married or partnered", "partnered"], ["Widowed", "widowed"], ["Orphaned or bereaved", "orphaned-bereaved"], ["Living with a disability", "disability"]].map(([label, value]) => <label key={value}><input type="checkbox" name="circumstances" value={value}/><span>{label}</span></label>)}</fieldset><small>You can leave this section blank or choose more than one.</small></details>

      <label className="consent"><input type="checkbox" name="consent" required/><span>I agree that Mindsupport may use my name and email to respond to this request.</span></label>
      <p className="form-privacy"><Icon name="shield" size={16}/> Your contact details and optional circumstances are stored with your request so the team can follow up. They are not part of anonymous messages.</p>
      <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey}/>
      <HoneypotField/>
    </section>

    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="booking-step-actions">{step > 1 && <button className="button button-outline" type="button" onClick={goBack} disabled={isSubmitting}>Back</button>}<button className="button button-primary form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving preview…" : step === TOTAL_STEPS ? "Request a free call" : "Continue"} {!isSubmitting && <Icon name="arrow"/>}</button></div>
  </form>;
}
