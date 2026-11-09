"use client";

import { FormEvent, useState } from "react";
import { Icon } from "./ui-icon";
import { validateAnonymousMessage } from "../lib/form-validation.mjs";

export function MessageForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const validationError = validateAnonymousMessage({ message: data.get("message"), anonymousConsent: data.get("anonymous") });
    if (validationError) { setError(validationError); return; }
    setError(""); setSent(true);
  }
  if (sent) return <div className="success-card message-success" role="status"><span className="success-mark"><Icon name="check" size={27}/></span><div className="section-label">MESSAGE PREVIEW</div><h2>Your words have<br/><em>a place here.</em></h2><p>This is a frontend preview. Your message has not been sent or stored. When secure delivery is connected, you’ll be able to share it anonymously with the Mindsupport team.</p><button className="button button-light" onClick={() => setSent(false)}>Write another message</button></div>;
  return <form className="message-form" onSubmit={handleSubmit} noValidate><div className="message-private"><Icon name="shield"/><span><b>This can be anonymous</b><small>No name, email, or account needed.</small></span></div><label className="field-label" htmlFor="message">What would you like us to know? <span>*</span></label><textarea id="message" name="message" rows={8} maxLength={2000} required placeholder="You can start with a feeling, a question, or simply: I’m not sure where to begin…"/><p className="message-helper">Share only what feels comfortable. Please don’t include details that could identify you or someone else.</p><label className="consent message-consent"><input type="checkbox" name="anonymous" required/><span>I understand this is an anonymous message and that replies won’t be possible unless I choose to leave contact details separately.</span></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="button button-light form-submit" type="submit">Leave my message <Icon name="arrow"/></button><p className="form-privacy"><Icon name="shield" size={16}/> This preview does not send or retain your message.</p></form>;
}
