"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "./ui-icon";
import { validateBookingStep } from "../lib/form-validation.mjs";
import { Booking, Lead, makeId, readDemoData, writeDemoData } from "../lib/demo-store";

const TOTAL_STEPS = 3;

export function BookingForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  useEffect(() => {
    if (step === 1) return;
    const heading = document.getElementById(`booking-step-${step}-title`);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const current = readDemoData();
    const lead: Lead = { id: makeId("LEAD"), name, email, phone: "", source: "Free call request", createdAt: new Date().toISOString() };
    const booking: Booking = { id: makeId("BOOK"), leadId: lead.id, service: "Free discovery call · 15 min", date: "", amount: 0, status: "Needs scheduling", paymentStatus: "Not requested" };
    setSaved(writeDemoData({ ...current, leads: [lead, ...current.leads], bookings: [booking, ...current.bookings] }));
    setSubmitted(true);
    submittingRef.current = false;
    setIsSubmitting(false);
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  if (submitted) return <div className="success-card" role="status"><span className="success-mark"><Icon name={saved ? "check" : "shield"} size={27}/></span><div className="section-label">{saved ? "PREVIEW REQUEST SAVED" : "PREVIEW REQUEST NOT SAVED"}</div><h2>{saved ? <>Thanks for taking<br/><em>that first step.</em></> : <>We couldn’t save<br/><em>this preview.</em></>}</h2><p>{saved ? "Your fictional details were added to this browser’s manager demo. This is not a confirmed appointment: no date was reserved, and nothing was sent to a server or email." : "This browser could not save your demo request. Nothing was sent to a server or email. Please try again."} Use fictional details only until secure booking storage is connected.</p><button className="button button-primary" type="button" onClick={() => { setSubmitted(false); setSaved(false); setStep(1); }}>Back to the form</button></div>;

  return <form className="form-card booking-form" onSubmit={handleSubmit} noValidate>
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

      <label className="consent"><input type="checkbox" name="consent" required/><span>I agree that Mindsupport may use my name and email to respond to this request.</span></label>
      <p className="form-privacy"><Icon name="shield" size={16}/> Preview only: fictional name and email are added to this browser’s demo leads. Optional personal context is not stored.</p>
    </section>

    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="booking-step-actions">{step > 1 && <button className="button button-outline" type="button" onClick={goBack} disabled={isSubmitting}>Back</button>}<button className="button button-primary form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving preview…" : step === TOTAL_STEPS ? "Request a free call" : "Continue"} {!isSubmitting && <Icon name="arrow"/>}</button></div>
  </form>;
}
