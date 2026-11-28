"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Icon } from "./ui-icon";
import { createRequestKey, downloadLeadExport, requestBackend } from "../lib/api-client";

type LeadEmail = { id: string; category: string; subject: string; textBody: string; status: string; createdAt: string; sentAt: string | null };
type Lead = { id: string; name: string; email: string; phone: string; source: string; createdAt: string; contactConsent: boolean; emails: LeadEmail[]; availability?: string | null; preferredDay?: string | null; preferredFormat?: string | null; circumstances?: string[] };
type Booking = { id: string; leadId: string; service: string; date: string; status: string };
type Message = { id: string; text: string; createdAt: string; source: string; publishConsent: boolean; status: "NEW" | "REVIEWED" | "PUBLISHED" | "DECLINED"; reflectionText: string };
type Subscriber = { id: string; email: string; source: string; consentGiven: boolean; consentAt: string };
type Workspace = { leads: Lead[]; bookings: Booking[]; messages: Message[]; subscribers: Subscriber[] };
type Staff = { id: string; email: string; role: string };
type Section = "overview" | "messages" | "leads" | "reflections" | "subscribers";

const emptyWorkspace: Workspace = { leads: [], bookings: [], messages: [], subscribers: [] };
const navigation: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "messages", label: "Anonymous messages", icon: "message" },
  { id: "leads", label: "Leads & bookings", icon: "calendar" },
  { id: "reflections", label: "Reflections", icon: "heart" },
  { id: "subscribers", label: "Quiet insights", icon: "mail" },
];

export function ManagerPortal() {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [section, setSection] = useState<Section>("overview");
  const [phase, setPhase] = useState<"checking" | "signed-out" | "ready" | "unavailable">("checking");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState("");
  const [followUpLead, setFollowUpLead] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [reflectionCopies, setReflectionCopies] = useState<Record<string, string>>({});

  const refreshWorkspace = useCallback(async () => {
    const data = await requestBackend<Workspace>("/api/admin/workspace");
    setWorkspace(data);
    setReflectionCopies((current) => {
      const next = { ...current };
      for (const message of data.messages) if (!(message.id in next)) next[message.id] = message.reflectionText || message.text;
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    requestBackend<{ staff: Staff }>("/api/auth/me").then(async (result) => {
      if (!active) return;
      setStaff(result.staff);
      try {
        await refreshWorkspace();
        if (active) setPhase("ready");
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "The staff workspace could not be loaded.");
          setPhase("unavailable");
        }
      }
    }).catch((reason: unknown) => {
      if (!active) return;
      if (reason instanceof Error && reason.message.includes("backend service")) setPhase("unavailable");
      else if (reason instanceof Error && reason.message.includes("couldn’t reach")) setPhase("unavailable");
      else setPhase("signed-out");
    });
    return () => { active = false; };
  }, [refreshWorkspace]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    let authenticated = false;
    try {
      const result = await requestBackend<{ staff: Staff }>("/api/auth/login", {
        method: "POST",
        body: { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") },
      });
      authenticated = true;
      setStaff(result.staff);
      await refreshWorkspace();
      setPhase("ready");
      setNotice("You’re signed in to the secure workspace.");
      formElement.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in right now.");
      if (authenticated) setPhase("unavailable");
    } finally { setBusy(false); }
  }

  async function signOut() {
    try { await requestBackend("/api/auth/logout", { method: "POST" }); }
    finally { setStaff(null); setWorkspace(emptyWorkspace); setPhase("signed-out"); setNotice(""); }
  }

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError("");
    try {
      await requestBackend("/api/admin/leads", {
        method: "POST", idempotencyKey: createRequestKey(),
        body: { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), phone: String(form.get("phone") ?? ""), source: String(form.get("source") ?? "Manual entry"), contactConsent: form.get("contactConsent") === "on" },
      });
      await refreshWorkspace(); setShowLeadForm(false); formElement.reset(); setNotice("Lead added securely.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add this lead."); }
    finally { setBusy(false); }
  }

  async function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError("");
    try {
      await requestBackend("/api/admin/bookings", {
        method: "POST", idempotencyKey: createRequestKey(),
        body: { leadId: String(form.get("leadId") ?? ""), tier: String(form.get("tier") ?? "") },
      });
      await refreshWorkspace(); formElement.reset(); setSelectedLead(""); setNotice("Session request created. Contact the client before confirming a time.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the booking."); }
    finally { setBusy(false); }
  }

  async function confirmBooking(event: FormEvent<HTMLFormElement>, booking: Booking) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledAt = String(form.get("scheduledAt") ?? "");
    setBusy(true); setError("");
    try {
      await requestBackend(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, {
        method: "PATCH",
        body: { status: "CONFIRMED", scheduledAt: new Date(scheduledAt).toISOString(), contactedAndAgreed: form.get("contactedAndAgreed") === "on" },
      });
      await refreshWorkspace(); setNotice("Session time confirmed after client contact.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not confirm this session request."); }
    finally { setBusy(false); }
  }

  async function cancelBooking(booking: Booking) {
    setBusy(true); setError("");
    try {
      await requestBackend(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, {
        method: "PATCH", body: { status: "CANCELLED", contactedAndAgreed: false },
      });
      await refreshWorkspace(); setNotice("Session request cancelled.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not cancel this session request."); }
    finally { setBusy(false); }
  }

  async function sendFollowUp(event: FormEvent<HTMLFormElement>, lead: Lead) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError("");
    try {
      await requestBackend(`/api/admin/leads/${encodeURIComponent(lead.id)}/follow-up`, {
        method: "POST", idempotencyKey: createRequestKey(),
        body: { subject: String(form.get("subject") ?? ""), textBody: String(form.get("textBody") ?? "") },
      });
      await refreshWorkspace(); formElement.reset(); setNotice("Follow-up email queued. Delivery status will appear on this lead.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not queue the follow-up email."); }
    finally { setBusy(false); }
  }

  async function exportLeads() {
    setIsExporting(true); setError("");
    try { await downloadLeadExport(); setNotice("Lead spreadsheet downloaded. Open the CSV in Google Sheets."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not download lead records."); }
    finally { setIsExporting(false); }
  }

  async function reviewMessage(message: Message, status: "REVIEWED" | "PUBLISHED" | "DECLINED") {
    setBusy(true); setError("");
    try {
      await requestBackend(`/api/admin/messages/${encodeURIComponent(message.id)}`, {
        method: "PATCH",
        body: { status, reflectionText: reflectionCopies[message.id] || "" },
      });
      await refreshWorkspace(); setNotice(status === "PUBLISHED" ? "Approved reflection published." : `Message marked ${status.toLowerCase()}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update the message."); }
    finally { setBusy(false); }
  }

  if (phase === "checking") return <main className="manager-page"><div className="manager-login-shell"><section className="manager-panel"><p>Checking staff session…</p></section></div></main>;

  if (phase !== "ready") return <main className="manager-page"><header className="manager-top"><div><span className="section-label">MINDSUPPORT · STAFF ACCESS</span><h1>Practice <em>workspace.</em></h1></div><span className="demo-mode"><i/> SECURE SIGN-IN</span></header><div className="manager-login-shell"><section className="manager-panel manager-login-panel"><span className="manager-avatar"><Icon name="shield" size={19}/></span><h2>{phase === "unavailable" ? "Workspace unavailable" : "Sign in to continue"}</h2><p>{phase === "unavailable" ? "The API or database is not ready yet. Check the backend connection and migration status, then reload this page." : "Only authorized Mindsupport staff can view leads, bookings, messages, and subscriber records."}</p>{phase === "unavailable" && error && <p className="form-error" role="alert">{error}</p>}{phase === "signed-out" && <form className="manager-login-form" onSubmit={signIn}><label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={128}/></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="manager-action manager-action-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form>}<small>Staff accounts are created privately by an administrator. There is no public sign-up.</small></section></div></main>;

  const newMessages = workspace.messages.filter((message) => message.status === "NEW").length;
  const published = workspace.messages.filter((message) => message.status === "PUBLISHED");
  const currentLabel = navigation.find((item) => item.id === section)?.label || "Workspace";

  return <main className="manager-page">
    <header className="manager-top"><div><span className="section-label">SECURE PRACTICE WORKSPACE</span><h1>Good morning, <em>team.</em></h1></div><div className="manager-user"><span>{staff?.email} · {staff?.role}</span><button type="button" className="manager-action manager-action-secondary" onClick={() => void signOut()}>Sign out</button></div></header>
    <div className="manager-workspace">
      <aside className="manager-sidebar"><div className="manager-sidebar-title"><span className="manager-avatar"><Icon name="grid" size={17}/></span><span><b>Mindsupport</b><small>Authenticated staff</small></span></div><nav aria-label="Manager sections">{navigation.map((item) => <button type="button" key={item.id} className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); setNotice(""); setError(""); }}><Icon name={item.icon} size={17}/>{item.label}{item.id === "messages" && newMessages > 0 && <span className="manager-nav-count">{newMessages}</span>}</button>)}</nav><div className="manager-sidebar-note"><Icon name="shield" size={16}/><span>Secure session<br/>Staff access</span></div></aside>
      <div className="manager-main"><header className="manager-main-head"><div><span className="section-label">PRACTICE WORKSPACE</span><h2>{currentLabel}</h2></div><span className="demo-mode"><i/> LIVE DATABASE</span></header>
        {notice && <p className="manager-notice" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}

        {section === "overview" && <><div className="manager-stats"><article><span>Leads</span><b>{workspace.leads.length}</b><small>Website and manually added</small></article><article><span>Session requests</span><b>{workspace.bookings.length}</b><small>Awaiting staff follow-up</small></article><article><span>Messages to review</span><b>{newMessages}</b><small>Consent recorded per message</small></article><article><span>Quiet insights opt-ins</span><b>{workspace.subscribers.length}</b><small>Kept separate from messages</small></article></div><section className="manager-panel"><div className="manager-panel-head"><div><h3>Next actions</h3><p>Review messages, follow up with leads, and contact people before confirming a time.</p></div></div><div className="manager-workflow"><span>1 <b>Review anonymous messages</b></span><span>2 <b>Follow up with leads</b></span><span>3 <b>Agree a session time</b></span><span>4 <b>Confirm after contacting the client</b></span></div></section></>}

        {section === "leads" && <>
          <section className="manager-panel">
            <div className="manager-panel-head"><div><h3>Leads and session requests</h3><p>Follow up with the person, agree a time, then record the confirmed details here.</p></div><div className="manager-row-actions"><button type="button" className="manager-action manager-action-secondary" disabled={isExporting || workspace.leads.length === 0} onClick={() => void exportLeads()}><Icon name="download" size={15}/>{isExporting ? "Preparing…" : "Download lead spreadsheet"}</button><button type="button" className="manager-action" onClick={() => setShowLeadForm((value) => !value)}>{showLeadForm ? "Cancel" : "+ Add lead"}</button></div></div>
            <p className="manager-footnote">The CSV includes contact details, consent, availability, session requests, agreed times, and email delivery status. Open it in Google Sheets. Anonymous messages and subscriber records are not included.</p>
            {showLeadForm && <form className="manager-form" onSubmit={addLead}><label>Name<input name="name" required maxLength={100}/></label><label>Email<input name="email" type="email" required maxLength={254}/></label><label>Phone <span>Optional</span><input name="phone" type="tel" maxLength={40}/></label><label>Source<select name="source"><option>Manual entry</option><option>Referral</option><option>Social media</option><option>Other</option></select></label><label className="consent"><input name="contactConsent" type="checkbox" required/><span>I have permission to contact this person by email.</span></label><button className="manager-action manager-action-primary" disabled={busy} type="submit">{busy ? "Saving…" : "Save lead"}</button></form>}
            {workspace.leads.map((lead) => <article className="manager-lead-card" key={lead.id}>
              <div className="manager-lead-heading"><span className="manager-avatar">{lead.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span><b>{lead.name}</b><small>{lead.email}{lead.phone ? " · " + lead.phone : ""}</small></span><small className="lead-source">{lead.source}</small><button type="button" className="manager-action manager-action-secondary" onClick={() => { setSelectedLead(lead.id); document.getElementById("admin-create-booking")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>+ Session request</button><button type="button" className="manager-action manager-action-secondary" disabled={!lead.contactConsent} title={lead.contactConsent ? "Compose a follow-up email" : "Contact permission has not been recorded"} onClick={() => setFollowUpLead((current) => current === lead.id ? "" : lead.id)}>Email follow-up</button></div>
              {lead.availability && <small className="manager-footnote">Preferred format: {lead.preferredFormat} · Available: {lead.availability}{lead.preferredDay ? " · " + lead.preferredDay : ""}{lead.circumstances?.length ? " · Shared context: " + lead.circumstances.join(", ") : ""}</small>}
              {workspace.bookings.filter((booking) => booking.leadId === lead.id).map((booking) => <div className="manager-booking-row" key={booking.id}><span><b>{booking.service}</b><small>{booking.date ? new Date(booking.date).toLocaleString() : "Time to be agreed"}</small></span><span className={"row-status " + (booking.status === "CONFIRMED" ? "new" : "pending")}>{booking.status === "CONFIRMED" ? "Confirmed" : booking.status === "CANCELLED" ? "Cancelled" : "Needs follow-up"}</span>{booking.status !== "CONFIRMED" && booking.status !== "CANCELLED" && <form className="manager-form" onSubmit={(event) => void confirmBooking(event, booking)}><label>Agreed date and time<input name="scheduledAt" type="datetime-local" required/></label><label className="consent"><input name="contactedAndAgreed" type="checkbox" required/><span>I have contacted the client and agreed this time with them.</span></label><button className="manager-action manager-action-primary" disabled={busy} type="submit">Confirm session time</button><button className="manager-text-action" type="button" disabled={busy} onClick={() => void cancelBooking(booking)}>Cancel request</button></form>}</div>)}
              {followUpLead === lead.id && lead.contactConsent && <form className="manager-form" onSubmit={(event) => void sendFollowUp(event, lead)}><label>Email subject<input name="subject" required maxLength={160} defaultValue="Following up on your Mindsupport request"/></label><label>Your message<textarea name="textBody" required maxLength={4000} rows={5} placeholder="Write a brief follow-up. Avoid including sensitive personal or clinical details."/></label><p className="manager-footnote">Queued through Resend to {lead.email}. Do not include sensitive clinical details in email.</p><button className="manager-action manager-action-primary" type="submit" disabled={busy}>{busy ? "Queueing…" : "Send follow-up email"}</button></form>}
              {lead.emails.length > 0 && <div className="manager-email-history"><b>Email activity</b>{lead.emails.map((email) => <small key={email.id}>{email.subject} · {email.status.toLowerCase().replaceAll("_", " ")}{email.sentAt ? " · sent " + new Date(email.sentAt).toLocaleString() : ""}</small>)}</div>}
            </article>)}
            {workspace.leads.length === 0 && <p className="manager-empty">No leads have been received yet.</p>}
          </section>
          <section className="manager-panel" id="admin-create-booking"><div className="manager-panel-head"><div><h3>Create a session request</h3><p>Create a request for a lead who contacted the practice outside this form.</p></div></div><form className="manager-form" onSubmit={addBooking}><label>Lead<select name="leadId" required value={selectedLead} onChange={(event) => setSelectedLead(event.target.value)}><option value="">Choose a lead</option>{workspace.leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.email}</option>)}</select></label><label>Session type<select name="tier" required defaultValue=""><option value="" disabled>Choose a session type</option><option value="15-minute">15-minute first conversation</option><option value="2-hour">2-hour session</option><option value="5-hour">5-hour session</option></select></label><button className="manager-action manager-action-primary" disabled={busy || workspace.leads.length === 0} type="submit">Create session request</button></form><p className="manager-footnote">Contact the client and agree the details before confirming a time. No payment is collected on the website.</p></section>
        </>}

        {section === "messages" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Anonymous message review</h3><p>Messages contain no contact details or IP address. A reviewed version appears publicly only after you publish it.</p></div><span className="row-status pending">{newMessages} new</span></div>{workspace.messages.length === 0 ? <p className="manager-empty">No anonymous messages to review.</p> : workspace.messages.map((message) => <article className="manager-lead-card" key={message.id}><div className="manager-message-card"><div className="manager-message-meta"><b>Anonymous message</b><span>{new Date(message.createdAt).toLocaleString()}</span><span className={`row-status ${message.status === "PUBLISHED" ? "new" : "pending"}`}>{message.status}</span></div><p>{message.text}</p><small>Publication consent: {message.publishConsent ? "Yes" : "No"}</small>{message.status !== "PUBLISHED" && message.status !== "DECLINED" && <><label className="field-label" htmlFor={`reflection-copy-${message.id}`}>Edit the public reflection text</label><textarea id={`reflection-copy-${message.id}`} className="manager-reflection-edit" value={reflectionCopies[message.id] || ""} maxLength={2000} onChange={(event) => setReflectionCopies((current) => ({ ...current, [message.id]: event.target.value }))}/><div className="manager-row-actions"><button type="button" className="manager-action manager-action-secondary" disabled={busy} onClick={() => void reviewMessage(message, "REVIEWED")}>Mark reviewed</button><button type="button" className="manager-action manager-action-primary" disabled={busy || !message.publishConsent} onClick={() => void reviewMessage(message, "PUBLISHED")}>Review &amp; publish</button><button type="button" className="manager-text-action" disabled={busy} onClick={() => void reviewMessage(message, "DECLINED")}>Decline</button></div></>}</div></article>)}</section>}

        {section === "reflections" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Published reflections</h3><p>Only the edited public reflection copy is exposed on the visitor feed.</p></div><span>{published.length} published</span></div>{published.length ? published.map((message) => <article className="manager-reflection-row" key={message.id}><p>“{message.reflectionText}”</p><small>Anonymous · {new Date(message.createdAt).toLocaleDateString()}</small><button type="button" className="manager-text-action" disabled={busy} onClick={() => void reviewMessage(message, "REVIEWED")}>Unpublish</button></article>) : <p className="manager-empty">No reflections have been published yet.</p>}<p className="manager-footnote">Subscriber records are separate and have no message ID, content, or reply contact.</p></section>}

        {section === "subscribers" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Quiet insights sign-ups</h3><p>Stored separately from anonymous messages. Welcome email and unsubscribe delivery are not connected yet.</p></div><span>{workspace.subscribers.length} subscribers</span></div>{workspace.subscribers.map((subscriber) => <article className="manager-subscriber-row" key={subscriber.id}><b>{subscriber.email}</b><small>Source: {subscriber.source} · Consent: {new Date(subscriber.consentAt).toLocaleString()}</small></article>)}{workspace.subscribers.length === 0 && <p className="manager-empty">No opt-ins yet.</p>}</section>}
      </div>
    </div>
  </main>;
}
