"use client";

export type Lead = { id: string; name: string; email: string; phone: string; source: string; createdAt: string };
export type Booking = { id: string; leadId: string; service: string; date: string; amount: number; status: "Scheduled" | "Needs scheduling"; paymentStatus: "Not requested" | "Link ready" | "Paid"; creditRegistrationId?: string; creditApplied?: boolean };
export type AnonymousMessage = { id: string; text: string; createdAt: string; source: string; publishConsent: boolean; replyByEmail: boolean; replyEmail: string; replyBySocial: boolean; socialHandle: string; status: "New" | "Reviewed" | "Published" | "Declined"; reflectionText: string };
export type Subscriber = { id: string; email: string; source: "reflections"; consentGiven: true; consentAt: string; createdAt: string };
export type Registration = { id: string; leadId: string; fee: number; term: string; status: "Requested" | "Paid"; freeSessionsGranted: number; freeSessionsRemaining: number; createdAt: string };
export type WorkspaceData = { leads: Lead[]; bookings: Booking[]; messages: AnonymousMessage[]; subscribers: Subscriber[]; registrations: Registration[] };

export const STORAGE_KEY = "mindsupport.manager-demo.v1";
export const DEMO_CHANGE_EVENT = "mindsupport:demo-data-changed";

const seed: WorkspaceData = {
  leads: [
    { id: "LEAD-104", name: "Alex Sample", email: "alex@example.test", phone: "", source: "Manual entry", createdAt: "Today" },
    { id: "LEAD-103", name: "Jordan Example", email: "jordan@example.test", phone: "", source: "Website inquiry", createdAt: "Yesterday" },
  ],
  bookings: [
    { id: "BOOK-102", leadId: "LEAD-104", service: "Individual therapy · 50 min", date: "", amount: 0, status: "Needs scheduling", paymentStatus: "Not requested" },
  ],
  messages: [],
  subscribers: [],
  registrations: [],
};

export function readDemoData(): WorkspaceData {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = JSON.parse(stored) as Partial<WorkspaceData>;
      if (Array.isArray(value.leads) && Array.isArray(value.bookings)) {
        return { leads: value.leads, bookings: value.bookings, messages: Array.isArray(value.messages) ? value.messages : [], subscribers: Array.isArray(value.subscribers) ? value.subscribers : [], registrations: Array.isArray(value.registrations) ? value.registrations : [] };
      }
    }
  } catch { /* Keep the demo usable if browser storage is unavailable. */ }
  return seed;
}

export function writeDemoData(data: WorkspaceData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(DEMO_CHANGE_EVENT));
    return true;
  } catch { return false; }
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
