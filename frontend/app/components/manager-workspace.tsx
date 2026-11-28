"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Booking, DEMO_CHANGE_EVENT, Lead, makeId, readDemoData, Subscriber, WorkspaceData, writeDemoData } from "../lib/demo-store";
import { Icon } from "./ui-icon";
import { ReflectionShareCard } from "./reflection-share-card";
import { HelpTip } from "./help-tip";

type Section = "overview" | "messages" | "leads" | "payments" | "reflections" | "subscribers" | "campaigns" | "analytics";
const nav: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "messages", label: "Anonymous messages", icon: "message" },
  { id: "leads", label: "Leads & bookings", icon: "calendar" },
  { id: "payments", label: "Payments", icon: "credit-card" },
  { id: "reflections", label: "Reflections", icon: "heart" },
  { id: "subscribers", label: "Quiet insights", icon: "mail" },
  { id: "campaigns", label: "Campaign sources", icon: "spark" },
  { id: "analytics", label: "Analytics", icon: "chart" },
];
const sectionHelp: Record<Section, string> = {
  overview: "A quick summary of the demo workspace, including leads, bookings, message review and subscriber counts.",
  messages: "Review anonymous submissions and their publication consent. Approve and edit a reflection before it appears publicly.",
  leads: "Add and find leads, then prepare a booking linked to the selected person. Payment links are only simulated in this preview.",
  payments: "Review payment-link status for directly booked sessions. This preview cannot take payment or verify a real transaction.",
  reflections: "See message excerpts approved for the local preview feed. Downloadable card images are preview actions.",
  subscribers: "View voluntary email sign-ups separately from anonymous messages. No email is sent in this preview.",
  campaigns: "Compare broad source labels to understand where demo enquiries came from. No individual message is tracked here.",
  analytics: "A placeholder for aggregate traffic and conversion reports. No live visitor analytics are connected.",
};

export function ManagerWorkspace() {
  const [data, setData] = useState<WorkspaceData>({ leads: [], bookings: [], messages: [], subscribers: [] });
  const [section, setSection] = useState<Section>("overview");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [bookingLead, setBookingLead] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const refresh = () => setData(readDemoData());
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(DEMO_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener(DEMO_CHANGE_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  function save(next: WorkspaceData) { writeDemoData(next); setData(next); }
  function announce(message: string) { setNotice(message); }

  function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("leadName") ?? "").trim();
    const email = String(form.get("leadEmail") ?? "").trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const lead: Lead = { id: makeId("LEAD"), name, email, phone: String(form.get("leadPhone") ?? "").trim(), source: String(form.get("leadSource") ?? "Manual entry"), createdAt: new Date().toISOString() };
    const next = { ...data, leads: [lead, ...data.leads] };
    save(next); setShowLeadForm(false); event.currentTarget.reset(); announce(`${name} added to the local demo leads.`);
  }

  function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const leadId = String(form.get("bookingLead") ?? "");
    const date = String(form.get("bookingDate") ?? "");
    const serviceChoice = String(form.get("bookingService") ?? "");
    const [service, tierAmount] = serviceChoice.split("|");
    const amount = tierAmount ? Number(tierAmount) : Number(form.get("bookingAmount"));
    if (!leadId || !service || !Number.isFinite(amount) || amount <= 0) return;
    const booking: Booking = { id: makeId("BOOK"), leadId, service, date, amount, status: date ? "Scheduled" : "Needs scheduling", paymentStatus: "Not requested" };
    save({ ...data, bookings: [booking, ...data.bookings] }); setBookingLead(""); event.currentTarget.reset(); announce(`Booking ${booking.id} created for this local demo.`);
  }

  function updateMessage(id: string, status: "Reviewed" | "Published" | "Declined", reflectionText?: string) {
    const next = { ...data, messages: data.messages.map((item) => item.id === id ? { ...item, status, reflectionText: reflectionText ?? item.reflectionText } : item) };
    save(next); announce(status === "Published" ? "Approved reflection is now visible in the preview feed." : `Message marked ${status.toLowerCase()}.`);
  }

  async function createPaymentLink(booking: Booking) {
    const lead = data.leads.find((item) => item.id === booking.leadId);
    const url = `${window.location.origin}/manager/demo-checkout?booking=${encodeURIComponent(booking.id)}&amount=${booking.amount}`;
    try { await navigator.clipboard.writeText(url); announce(`Demo payment link for ${lead?.name ?? "this lead"} copied. No email, SMS, or payment was sent.`); }
    catch { announce(`Demo payment URL: ${url}`); }
    save({ ...data, bookings: data.bookings.map((item) => item.id === booking.id ? { ...item, paymentStatus: "Link ready" } : item) });
  }

  function markDemoPaid(booking: Booking) { save({ ...data, bookings: data.bookings.map((item) => item.id === booking.id ? { ...item, paymentStatus: "Paid" } : item) }); announce(`${booking.id} marked paid for demonstration only; no payment was verified.`); }
  function resetDemo() { const empty: WorkspaceData = { leads: [], bookings: [], messages: [], subscribers: [] }; save(empty); announce("Local preview records cleared. This does not delete server data."); }

  const visibleLeads = useMemo(() => data.leads.filter((lead) => `${lead.name} ${lead.email}`.toLowerCase().includes(search.toLowerCase())), [data.leads, search]);
  const outstanding = data.bookings.filter((booking) => booking.paymentStatus !== "Paid").length;
  const newMessages = data.messages.filter((message) => message.status === "New").length;
  const publishedMessages = data.messages.filter((message) => message.status === "Published");

  return <div className="manager-workspace">
    <aside className="manager-sidebar"><div className="manager-sidebar-title"><span className="manager-avatar"><Icon name="grid" size={17}/></span><span><b>Mindsupport</b><small>Manager preview</small></span></div><nav aria-label="Manager sections">{nav.map((item) => <button type="button" key={item.id} className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); setNotice(""); }}><Icon name={item.icon} size={17}/>{item.label}{item.id === "messages" && newMessages > 0 && <span className="manager-nav-count">{newMessages}</span>}</button>)}</nav><div className="manager-sidebar-note"><Icon name="shield" size={16}/><span>Local demo only<br/>No secure sign-in</span></div></aside>
    <div className="manager-main"><header className="manager-main-head"><div><span className="section-label">PRACTICE WORKSPACE · PREVIEW</span><div className="manager-title-row"><h2>{nav.find((item) => item.id === section)?.label}</h2><HelpTip label={nav.find((item) => item.id === section)?.label ?? "Workspace"}>{sectionHelp[section]}</HelpTip></div></div><span className="demo-mode"><i/> DEMO DATA</span></header>
      {notice && <p className="manager-notice" role="status">{notice}</p>}
      {section === "overview" && <><div className="manager-stats"><article><span>Leads</span><b>{data.leads.length}</b><small>Website and manual records</small></article><article><span>Bookings</span><b>{data.bookings.length}</b><small>Connected to a lead</small></article><article><span>Messages to review</span><b>{newMessages}</b><small>Consent recorded in demo</small></article><article><span>Quiet insights sign-ups</span><b>{data.subscribers.length}</b><small>Separate subscriber list</small></article></div><section className="manager-panel"><div className="manager-panel-head"><div><h3>Practice activity</h3><p>Preview of the work that will be managed from this workspace.</p></div></div><div className="manager-workflow"><span>1 <b>Review anonymous messages</b></span><span>2 <b>Manage leads &amp; bookings</b></span><span>3 <b>Track payment status</b></span><span>4 <b>Approve reflections</b></span></div></section><section className="manager-panel"><div className="manager-panel-head"><div><h3>Backend boundary</h3><p>This workspace is not a secure staff portal. Use fictional data only until authenticated storage is connected.</p></div></div><button type="button" className="manager-action manager-action-secondary" onClick={resetDemo}>Clear this browser’s demo records</button></section></>}

      {section === "messages" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Anonymous message review</h3><p>Review the submission and publication permission. Nothing appears publicly until approved.</p></div><span className="row-status pending">{newMessages} new</span></div>{data.messages.length === 0 ? <p className="manager-empty">No local preview messages yet. Submit a fictional message on the Anonymous Message page.</p> : <div className="manager-lead-list">{data.messages.map((message) => <article className="manager-lead-card" key={message.id}><div className="manager-message-card"><div className="manager-message-meta"><b>{message.id}</b><span>{new Date(message.createdAt).toLocaleString()}</span><span className={`row-status ${message.status === "Published" ? "new" : "pending"}`}>{message.status}</span></div><p>{message.text}</p><small>Source: {message.source} · Publication consent: {message.publishConsent ? "Yes" : "No"}</small>{(message.replyByEmail || message.replyBySocial) && <small>Separate reply request: {message.replyByEmail ? `email ${message.replyEmail}` : ""}{message.replyByEmail && message.replyBySocial ? " · " : ""}{message.replyBySocial ? `social ${message.socialHandle}` : ""}</small>}{message.status !== "Published" && message.status !== "Declined" && <div className="manager-row-actions"><button className="manager-action manager-action-secondary" type="button" onClick={() => updateMessage(message.id, "Reviewed")}>Mark reviewed</button><button className="manager-action manager-action-primary" type="button" disabled={!message.publishConsent} onClick={() => { const excerpt = window.prompt("Review and edit the anonymous text that will appear in Reflections:", message.text); if (excerpt?.trim()) updateMessage(message.id, "Published", excerpt.trim()); }}>Review &amp; publish</button><button className="manager-text-action" type="button" onClick={() => updateMessage(message.id, "Declined")}>Decline publication</button></div>}</div></article>)}</div>}<p className="manager-footnote">In production, message content and optional reply contact will be encrypted/protected in the message record. IP addresses and subscriber records must not be attached to the public reflection.</p></section>}

      {section === "leads" && <><section className="manager-panel" id="leads"><div className="manager-panel-head"><div><h3>Leads &amp; bookings</h3><p>Add a lead manually or find one from a visitor enquiry, then create a booking.</p></div><button type="button" className="manager-action" onClick={() => { setShowLeadForm((open) => !open); setNotice(""); }}>{showLeadForm ? "Cancel" : "+ Add lead"}</button></div>{showLeadForm && <form className="manager-form" onSubmit={addLead}><label>Name<input name="leadName" required maxLength={100} placeholder="Lead name" autoComplete="off"/></label><label>Email<input name="leadEmail" required type="email" maxLength={254} placeholder="name@example.test" autoComplete="off"/></label><label>Phone <span>Optional</span><input name="leadPhone" type="tel" maxLength={40} placeholder="Phone number"/></label><label>Source<select name="leadSource"><option>Manual entry</option><option>Free call request</option><option>Direct session</option><option>Referral</option><option>Social media</option><option>Other</option></select></label><button className="manager-action manager-action-primary" type="submit">Save demo lead</button></form>}<div className="manager-tools"><label className="manager-search"><Icon name="search" size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads by name or email" aria-label="Search leads"/></label><span>{visibleLeads.length} leads</span></div><div className="manager-lead-list">{visibleLeads.map((lead) => { const bookings = data.bookings.filter((booking) => booking.leadId === lead.id); return <article className="manager-lead-card" key={lead.id}><div className="manager-lead-heading"><span className="manager-avatar">{lead.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span><b>{lead.name}</b><small>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</small></span><small className="lead-source">{lead.source}</small><button type="button" className="manager-action manager-action-secondary" onClick={() => { setBookingLead(lead.id); document.getElementById("create-booking")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>+ Booking</button></div>{bookings.map((booking) => <div className="manager-booking-row" key={booking.id}><span><b>{booking.service}</b><small>{booking.id} · {booking.date || "Date to be arranged"} · {booking.amount.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</small></span><span className={`row-status ${booking.paymentStatus === "Paid" ? "new" : "pending"}`}>{booking.paymentStatus}</span><button type="button" className="manager-action manager-action-secondary" onClick={() => void createPaymentLink(booking)}>Create/copy demo payment link</button></div>)}</article>; })}{visibleLeads.length === 0 && <p className="manager-empty">No leads match. Add one or try another search.</p>}</div></section><section className="manager-panel" id="create-booking"><div className="manager-panel-head"><div><h3>Create a booking</h3><p>Every booking is linked to one lead.</p></div></div><form className="manager-form" onSubmit={addBooking}><label>Lead<select name="bookingLead" required value={bookingLead} onChange={(event) => setBookingLead(event.target.value)}><option value="">Choose a lead</option>{data.leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.email}</option>)}</select></label><label>Service<select name="bookingService" required defaultValue=""><option value="" disabled>Choose a session type</option><option value="50-minute session|10000">50-minute session · ₦10,000</option><option value="2-hour session|30000">2-hour session · ₦30,000</option><option value="5-hour session|70000">5-hour session · ₦70,000</option><option value="Custom session">Custom session</option></select></label><label>Session date <span>Optional</span><input name="bookingDate" type="datetime-local"/></label><label>Custom amount (NGN) · optional<input name="bookingAmount" type="number" min="1" step="1" placeholder="Only for a custom session"/></label><button className="manager-action manager-action-primary" type="submit" disabled={data.leads.length === 0}>Create demo booking</button></form></section></>}

      {section === "payments" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Session bookings &amp; payment status</h3><p>{outstanding} bookings need payment follow-up. Direct options: 50 minutes for ₦10,000, 2 hours for ₦30,000, and 5 hours for ₦70,000.</p></div><span className="demo-mode"><i/> NOT CONNECTED</span></div>{data.bookings.length ? <div className="manager-lead-list">{data.bookings.map((booking) => { const lead = data.leads.find((item) => item.id === booking.leadId); return <article className="manager-lead-card" key={booking.id}><div className="manager-booking-row"><span><b>{booking.service}</b><small>{booking.id} · {lead?.name ?? "Lead missing"} · {booking.date || "Date to arrange"} · {booking.amount.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}</small></span><span className={`row-status ${booking.paymentStatus === "Paid" ? "new" : "pending"}`}>{booking.paymentStatus}</span><div className="manager-row-actions"><button type="button" className="manager-action manager-action-secondary" onClick={() => void createPaymentLink(booking)}>{booking.paymentStatus === "Link ready" ? "Copy link again" : "Create payment link"}</button>{booking.paymentStatus !== "Paid" && <button type="button" className="manager-text-action" onClick={() => markDemoPaid(booking)}>Mark paid (demo)</button>}</div></div></article>; })}</div> : <p className="manager-empty">No bookings are in this demo.</p>}<p className="manager-footnote">“Mark paid” is a visual state only. In production, a signed Paystack webhook verifies payment. No email or payment is sent here.</p></section>}
      {section === "reflections" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Public Reflections</h3><p>Only messages explicitly permitted and approved appear in the feed.</p></div><span>{publishedMessages.length} published</span></div>{publishedMessages.length ? publishedMessages.map((message) => <article className="manager-reflection-row" key={message.id}><p>“{message.reflectionText}”</p><small>{message.id} · approved preview copy</small><ReflectionShareCard text={message.reflectionText} label={message.id}/><button type="button" className="manager-text-action" onClick={() => updateMessage(message.id, "Reviewed", "")}>Remove from public preview</button></article>) : <p className="manager-empty">No approved visitor reflections yet. Review a message and choose “Review &amp; publish”.</p>}<p className="manager-footnote">The email insights list has no message ID or link to this review queue.</p></section>}

      {section === "subscribers" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Quiet insights sign-ups</h3><p>This list is stored separately from anonymous messages and reply requests.</p></div><span>{data.subscribers.length} subscribers</span></div>{data.subscribers.length ? <div className="manager-subscriber-list">{data.subscribers.map((subscriber: Subscriber) => <article key={subscriber.id}><b>{subscriber.email}</b><span>Source: {subscriber.source} · Consent: {new Date(subscriber.consentAt).toLocaleString()}</span></article>)}</div> : <p className="manager-empty">No opt-ins in this browser yet.</p>}<p className="manager-footnote">Subscriber records have no message ID, content, or reply contact. No welcome email is sent by this preview.</p></section>}

      {section === "campaigns" && <section className="manager-panel"><div className="manager-panel-head"><div><h3>Campaign sources</h3><p>Preview source totals show how inquiry channels can be tracked after a backend is connected.</p></div></div><div className="manager-source-list">{["Anonymous website", "Free call request", "Direct session", "Manual entry", "Referral", "Social media", "Other"].map((source) => <div key={source}><span>{source}</span><b>{data.messages.filter((item) => item.source === source).length + data.leads.filter((item) => item.source === source).length}</b></div>)}</div><p className="manager-footnote">Campaign attribution can use an approved source code or UTM values. Avoid storing IP addresses or tracking identifiers on anonymous submissions.</p></section>}

      {section === "analytics" && <><div className="manager-stats analytics-stats"><article><span>Visitors</span><b>—</b><small>Waiting for analytics connection</small></article><article><span>Top traffic source</span><b>—</b><small>Referral and campaign reporting</small></article><article><span>Most viewed page</span><b>—</b><small>Aggregate page views</small></article><article><span>Booking requests</span><b>—</b><small>Funnel conversion reporting</small></article></div><section className="manager-panel"><div className="manager-panel-head"><div><h3>Traffic and campaign performance</h3><p>Planned: visits over time, referring sites, UTM campaigns, device mix, landing pages, and anonymous call/session funnel events.</p></div><span className="demo-mode"><i/> NOT CONNECTED</span></div><div className="analytics-empty"><Icon name="chart" size={22}/><b>Traffic data will appear here after analytics is connected.</b><span>No live visitor or campaign metrics are available in this local preview.</span></div></section><section className="manager-panel analytics-demographics"><div className="manager-panel-head"><div><h3>Age demographics</h3><p>Aggregate age brackets from the analytics provider</p></div><span className="row-status pending">Not connected</span></div><div className="analytics-age-groups">{["18–24", "25–34", "35–44", "45–54", "55–64", "65+"].map((range) => <div key={range}><span>{range}</span><b>—</b></div>)}</div><p>Age brackets will appear here when available from the analytics provider. Reports may not cover every visitor. This dashboard will not link demographic groups to anonymous messages or individual client records.</p></section><p className="manager-footnote">Planned analytics will exclude anonymous message text, email addresses, health details, and record identifiers. Cloudflare bot protection and server-side request validation are separate security controls.</p></>}
    </div>
  </div>;
}
