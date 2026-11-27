"use client";

import { FormEvent, useEffect, useState } from "react";
import { Booking, DEMO_CHANGE_EVENT, Lead, makeId, readDemoData, Registration, writeDemoData, WorkspaceData } from "../lib/demo-store";
import { Icon } from "./ui-icon";

const REGISTRATION_TIERS = [
  { id: "month", label: "Monthly", duration: "1 month", amount: 10000, confirmed: true },
  { id: "six-months", label: "Six months", duration: "6 months", amount: 60000, confirmed: true },
  { id: "year", label: "Yearly", duration: "12 months", amount: null, confirmed: false },
  { id: "lifetime", label: "Lifetime", duration: "Lifetime", amount: null, confirmed: false },
] as const;
const SESSION_FEE = 10000;

export function SessionsBooking() {
  const [path, setPath] = useState<"membership" | "one-off">("membership");
  const [selectedTier, setSelectedTier] = useState<(typeof REGISTRATION_TIERS)[number]["id"]>("month");
  const [notice, setNotice] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [data, setData] = useState<WorkspaceData | null>(null);
  useEffect(() => {
    const sync = () => setData(readDemoData());
    sync();
    window.addEventListener(DEMO_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const lead = data?.leads.find((item) => item.email.toLowerCase() === lookupEmail.trim().toLowerCase());
  const registration = lead && data ? data.registrations.find((item) => item.leadId === lead.id && item.status === "Paid") : undefined;

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const tier = REGISTRATION_TIERS.find((item) => item.id === selectedTier);
    if (!name || !email || !tier?.amount) return;
    const current = readDemoData();
    const newLead: Lead = { id: makeId("LEAD"), name, email, phone: "", source: "Direct session · registration", createdAt: new Date().toISOString() };
    const newRegistration: Registration = { id: makeId("REG"), leadId: newLead.id, fee: tier.amount, term: tier.duration, status: "Requested", freeSessionsGranted: 0, freeSessionsRemaining: 0, createdAt: new Date().toISOString() };
    const saved = writeDemoData({ ...current, leads: [newLead, ...current.leads], registrations: [newRegistration, ...current.registrations] });
    setData(readDemoData());
    setNotice(saved ? `${tier.label} registration request saved to this browser’s demo. No payment was taken or verified.` : "The registration request could not be saved in this browser.");
    setLookupEmail(email);
    event.currentTarget.reset();
  }

  function requestSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead || !registration) return;
    const form = new FormData(event.currentTarget);
    const duration = String(form.get("duration") ?? "50");
    const free = registration.freeSessionsRemaining > 0;
    const booking: Booking = { id: makeId("BOOK"), leadId: lead.id, service: `${duration}-minute session${free ? " · complimentary" : ""}`, date: "", amount: free ? 0 : SESSION_FEE, status: "Needs scheduling", paymentStatus: "Not requested", ...(free ? { creditRegistrationId: registration.id, creditApplied: false } : {}) };
    const current = readDemoData();
    const saved = writeDemoData({ ...current, bookings: [booking, ...current.bookings] });
    setData(readDemoData());
    setNotice(saved ? (free ? `${booking.id} is awaiting scheduling. The included session remains available until an appointment is confirmed.` : `${booking.id} was added at ₦${SESSION_FEE.toLocaleString()} in the demo.`) : "The session request could not be saved in this browser.");
    event.currentTarget.reset();
  }

  function requestOneOff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("oneOffName") ?? "").trim();
    const email = String(form.get("oneOffEmail") ?? "").trim().toLowerCase();
    const duration = String(form.get("oneOffDuration") ?? "50");
    if (!name || !email) return;
    const current = readDemoData();
    const existingLead = current.leads.find((item) => item.email.toLowerCase() === email);
    const lead = existingLead ?? { id: makeId("LEAD"), name, email, phone: "", source: "Direct session · one-off", createdAt: new Date().toISOString() };
    const booking: Booking = { id: makeId("BOOK"), leadId: lead.id, service: `${duration}-minute one-off session`, date: "", amount: SESSION_FEE, status: "Needs scheduling", paymentStatus: "Not requested" };
    const saved = writeDemoData({ ...current, leads: existingLead ? current.leads : [lead, ...current.leads], bookings: [booking, ...current.bookings] });
    setData(readDemoData());
    setNotice(saved ? `One-off session request ${booking.id} is in the local demo at ₦${SESSION_FEE.toLocaleString()}. No payment was taken or booking confirmed.` : "The one-off session request could not be saved in this browser.");
    event.currentTarget.reset();
  }

  return <div className="session-booking-flow">
    <div className="session-path-switch" role="tablist" aria-label="Choose how to book"><button type="button" role="tab" aria-selected={path === "one-off"} className={path === "one-off" ? "selected" : ""} onClick={() => { setPath("one-off"); setNotice(""); }}>Book one session</button><button type="button" role="tab" aria-selected={path === "membership"} className={path === "membership" ? "selected" : ""} onClick={() => { setPath("membership"); setNotice(""); }}>Membership options</button></div>
    {path === "membership" && <>
    <div className="session-steps"><span><i>1</i> Choose a membership</span><span><i>2</i> Pay registration</span><span><i>3</i> Use 3 included sessions</span></div>
    <div className="registration-tiers" aria-label="Registration membership term">{REGISTRATION_TIERS.map((tier) => <button key={tier.id} type="button" className={`registration-tier${selectedTier === tier.id ? " selected" : ""}`} onClick={() => setSelectedTier(tier.id)} aria-pressed={selectedTier === tier.id}><span>{tier.label}</span><b>{tier.amount ? `₦${tier.amount.toLocaleString()}` : "Price to confirm"}</b><small>{tier.duration}</small>{!tier.confirmed && <small>Pending business price</small>}</button>)}</div>
    <form className="session-action-card" onSubmit={submitRegistration}><h2>Register for {REGISTRATION_TIERS.find((tier) => tier.id === selectedTier)?.label.toLowerCase()}</h2><p>A successful registration includes three sessions for the membership term. After those are used, each additional session costs ₦{SESSION_FEE.toLocaleString()} for 30, 50, or 60 minutes.</p><label className="field-label" htmlFor="registration-name">Your name</label><input id="registration-name" name="name" required maxLength={100} autoComplete="name" placeholder="Your name"/><label className="field-label" htmlFor="registration-email">Email address</label><input id="registration-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/><button type="submit" className="button button-primary" disabled={!REGISTRATION_TIERS.find((tier) => tier.id === selectedTier)?.amount}>Request {REGISTRATION_TIERS.find((tier) => tier.id === selectedTier)?.label.toLowerCase()} registration <Icon name="arrow"/></button><p className="form-privacy"><Icon name="shield" size={16}/> Local preview only. A request does not verify payment or activate membership.</p></form>
    <div className="session-action-card"><h2>Already registered?</h2><p>Check the demo membership using the email you registered with.</p><label className="field-label" htmlFor="lookup-email">Registration email</label><input id="lookup-email" type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" value={lookupEmail} onChange={(event) => setLookupEmail(event.target.value)}/>{registration ? <><div className="session-balance"><span>Included sessions remaining</span><b>{registration.freeSessionsRemaining} / 3</b></div><small className="session-demo-hint">Demo only: this balance appears because the manager marked registration paid locally.</small></> : <small className="session-demo-hint">Three sessions become available only after the registration fee is confirmed.</small>}</div>
    {registration && <form className="session-action-card" onSubmit={requestSession}><h2>Request a session</h2><p>{registration.freeSessionsRemaining > 0 ? "Your registration includes a session at no extra charge." : `Your three included sessions are used. Additional sessions are ₦${SESSION_FEE.toLocaleString()} each.`}</p><label className="field-label" htmlFor="session-duration">Session length</label><select id="session-duration" name="duration" defaultValue="50"><option value="30">30 minutes</option><option value="50">50 minutes</option><option value="60">60 minutes</option></select><p className="session-price-line">{registration.freeSessionsRemaining > 0 ? "₦0 · included session" : `₦${SESSION_FEE.toLocaleString()} · one session`}</p><button type="submit" className="button button-primary">Request this session <Icon name="arrow"/></button></form>}
    </>}
    {path === "one-off" && <form className="session-action-card" onSubmit={requestOneOff}><h2>One session · ₦{SESSION_FEE.toLocaleString()}</h2><label className="field-label" htmlFor="one-off-name">Your name</label><input id="one-off-name" name="oneOffName" required maxLength={100} autoComplete="name" placeholder="Your name"/><label className="field-label" htmlFor="one-off-email">Email address</label><input id="one-off-email" name="oneOffEmail" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/><label className="field-label" htmlFor="one-off-duration">Session length</label><select id="one-off-duration" name="oneOffDuration" defaultValue="50"><option value="30">30 minutes</option><option value="50">50 minutes</option><option value="60">60 minutes</option></select><p className="session-price-line">₦{SESSION_FEE.toLocaleString()} · no registration required</p><button type="submit" className="button button-primary">Continue <Icon name="arrow"/></button><p className="form-privacy"><Icon name="shield" size={16}/> Preview only. Payment and booking confirmation are not connected yet.</p></form>}
    {notice && <p className="manager-notice" role="status">{notice}</p>}
  </div>;
}
