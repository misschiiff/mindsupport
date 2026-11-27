"use client";

import { FormEvent, useState } from "react";
import { makeId, readDemoData, Subscriber, writeDemoData } from "../lib/demo-store";
import { Icon } from "./ui-icon";

export function SubscriberSignup({ variant = "card" }: { variant?: "card" | "inline" }) {
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("subscriber-email") ?? "").trim().toLowerCase();
    const consent = form.get("subscriber-consent") === "on";
    if (!email || !consent) { setError("Enter your email and choose to receive the updates."); return; }
    const data = readDemoData();
    if (data.subscribers.some((item) => item.email === email)) { setError("That email is already on this preview list."); return; }
    const now = new Date().toISOString();
    const subscriber: Subscriber = { id: makeId("SUB"), email, source: "reflections", consentGiven: true, consentAt: now, createdAt: now };
    const saved = writeDemoData({ ...data, subscribers: [subscriber, ...data.subscribers] });
    setError("");
    setSaved(saved);
    setDone(true);
    if (!saved) setError("Preview only: this browser could not save the sign-up.");
  }

  return <article className={`subscriber-card subscriber-card-${variant}`}>
    {done ? <div className="subscriber-success" role="status"><span className="subscriber-icon"><Icon name="check" size={19}/></span><div><b>{saved ? "You’re on the list in this preview." : "Your sign-up wasn’t saved."}</b><p>{saved ? "No email was sent. A connected backend will deliver the welcome reflection and let you unsubscribe at any time." : "This browser could not save the local preview entry. Nothing was sent."}</p></div></div> : <>
      <span className="section-label">A SMALL NOTE FOR LATER</span>
      <h2>Quiet insights, when you need them.</h2>
      <p>Occasional, grounded reflections to help you pause and check in with yourself.</p>
      <form onSubmit={submit}>
        <label className="sr-only" htmlFor={`subscriber-email-${variant}`}>Email address</label>
        <div className="subscriber-input-row"><input id={`subscriber-email-${variant}`} name="subscriber-email" type="email" autoComplete="email" maxLength={254} placeholder="Your email address" required/><button className="button button-primary" type="submit">Send me quiet insights <Icon name="arrow" size={16}/></button></div>
        <label className="subscriber-consent"><input name="subscriber-consent" type="checkbox" required/><span>I agree to receive occasional Mindsupport insights by email.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <small>No spam. Just quiet, grounded insights. Unsubscribe anytime.</small>
      <small className="subscriber-demo-note">Preview only: this sign-up stays in this browser. No email is sent.</small>
    </>}
  </article>;
}
