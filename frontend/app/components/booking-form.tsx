"use client";

import { FormEvent, useState } from "react";
import { Icon } from "./ui-icon";
import { validateBooking } from "../lib/form-validation.mjs";

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const validationError = validateBooking({ name: data.get("name"), email: data.get("email"), format: data.get("format"), availability: data.get("availability"), consent: data.get("consent") });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitted(true);
  }
  if (submitted) return <div className="success-card" role="status"><span className="success-mark"><Icon name="check" size={27}/></span><div className="section-label">YOUR REQUEST IS READY</div><h2>Thanks for taking<br/><em>that first step.</em></h2><p>This is a frontend preview. Your details haven’t been sent or saved. When the secure booking service is connected, this step will deliver your request to the Mindsupport team.</p><button className="button button-primary" onClick={() => setSubmitted(false)}>Back to the form</button></div>;
  return <form className="form-card" onSubmit={handleSubmit} noValidate>
    <div className="form-heading"><span className="step-count">01 <i>—</i> 02</span><span className="form-estimate"><Icon name="clock" size={15}/> About 2 minutes</span></div>
    <h2>Let’s find a time<br/><em>to talk things through.</em></h2><p className="form-intro">A few details help us make your free first call feel a little more like yours.</p>
    <label className="field-label" htmlFor="name">What should we call you? <span>*</span></label><input id="name" name="name" autoComplete="name" placeholder="Your name" required/>
    <label className="field-label" htmlFor="email">Where can we reach you? <span>*</span></label><input id="email" name="email" type="email" autoComplete="email" placeholder="Email address" required/>
    <label className="field-label">What kind of support are you looking for? <span className="optional">Optional</span></label><div className="choice-grid three"><label className="choice"><input type="radio" name="support" value="individual" defaultChecked/><span>Individual</span></label><label className="choice"><input type="radio" name="support" value="couples"/><span>Couples</span></label><label className="choice"><input type="radio" name="support" value="unsure"/><span>Not sure yet</span></label></div>
    <label className="field-label">What works best for you? <span>*</span></label><div className="choice-grid three"><label className="choice"><input type="radio" name="format" value="online"/><span><Icon name="video" size={17}/> Online</span></label><label className="choice"><input type="radio" name="format" value="in-person"/><span><Icon name="pin" size={17}/> In person</span></label><label className="choice"><input type="radio" name="format" value="either"/><span>Either works</span></label></div>
    <label className="field-label" htmlFor="availability">When are you usually available? <span>*</span></label><select id="availability" name="availability" defaultValue="" required><option value="" disabled>Choose a time of day</option><option>Weekday mornings</option><option>Weekday afternoons</option><option>Weekday evenings</option><option>Weekends</option><option>Flexible</option></select>
    <label className="field-label" htmlFor="date">A day that tends to work <span className="optional">Optional</span></label><select id="date" name="date" defaultValue=""><option value="">No preference</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select>
    <label className="field-label" htmlFor="topic">What would you like support with? <span className="optional">Optional</span></label><select id="topic" name="topic" defaultValue=""><option value="">Prefer not to say</option><option>Stress or feeling overwhelmed</option><option>Anxiety or low mood</option><option>Relationships or family</option><option>Life changes or loss</option><option>Self-understanding</option><option>Something else</option></select>
    <label className="field-label" htmlFor="note">Anything you’d like us to know? <span className="optional">Optional</span></label><textarea id="note" name="note" rows={3} maxLength={500} placeholder="Only share what feels comfortable. Please avoid sensitive or urgent details here."/>
    <label className="consent"><input type="checkbox" name="consent" required/><span>I’m happy for Mindsupport to use these details to follow up about this introductory call. <a href="#privacy">Privacy information</a>.</span></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button button-primary form-submit" type="submit">Request a free call <Icon name="arrow"/></button>
    <p className="form-privacy"><Icon name="shield" size={16}/> Your details will be treated with care. This preview does not submit or retain form information.</p>
  </form>;
}
