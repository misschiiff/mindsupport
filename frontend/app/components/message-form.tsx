"use client";

import { FormEvent, useState } from "react";
import { Icon } from "./ui-icon";
import { validateAnonymousMessage } from "../lib/form-validation.mjs";
import { makeId, readDemoData, AnonymousMessage, writeDemoData } from "../lib/demo-store";
import { SubscriberSignup } from "./subscriber-signup";

export function MessageForm({ source = "Anonymous website" }: { source?: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const validationError = validateAnonymousMessage({ message: data.get("message"), publishConsent: data.get("publish") });
    if (validationError) { setError(validationError); return; }
    const now = new Date().toISOString();
    const message: AnonymousMessage = { id: makeId("MSG"), text: String(data.get("message") ?? "").trim(), createdAt: now, source, publishConsent: true, replyByEmail: false, replyEmail: "", replyBySocial: false, socialHandle: "", status: "New", reflectionText: "" };
    const current = readDemoData();
    setSaved(writeDemoData({ ...current, messages: [message, ...current.messages] }));
    setError(""); setSent(true);
  }
  if (sent) return <div className="message-success-wrap"><div className="success-card message-success" role="status"><span className="success-mark"><Icon name="check" size={27}/></span><div className="section-label">A FIRST STEP, RECEIVED</div><h2>Your message is safe<br/><em>with us.</em></h2><p>{saved ? "It’s in this browser’s demo review queue for the team to review." : "This browser couldn’t save the demo message. Nothing was sent to a server."}</p><p className="form-privacy"><Icon name="shield" size={16}/> Preview only: no secure server or email delivery is connected. Use fictional content here.</p><button className="button button-light" onClick={() => setSent(false)}>Send another message</button></div><div className="message-next-step"><div className="section-label">IF A SMALL PAUSE WOULD HELP</div><h2>A gentle reflection for later.</h2><p>Receive occasional, grounded prompts by email. This choice is separate from your anonymous message.</p><SubscriberSignup variant="inline"/></div></div>;
  return <form className="message-form" onSubmit={handleSubmit} noValidate>
    <label className="field-label" htmlFor="message">Your message <span>*</span></label>
    <textarea id="message" name="message" rows={7} maxLength={2000} required placeholder="You can start with a feeling, a question, or simply: I’m not sure where to begin…"/>
    <p className="message-helper">Please don’t include names or details that could identify you or someone else.</p>
    <label className="consent message-consent"><input type="checkbox" name="publish" required/><span>I understand my anonymous message may be shared publicly to encourage others.</span></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button button-light form-submit" type="submit">Send anonymous message <Icon name="arrow"/></button>
    <p className="form-privacy"><Icon name="shield" size={16}/> Preview only: fictional details stay in this browser’s demo queue. No network submission is connected.</p>
  </form>;
}
