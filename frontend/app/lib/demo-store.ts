"use client";

export type Lead = { id: string; name: string; email: string; phone: string; source: string; createdAt: string; circumstances?: string[] };
export type Booking = { id: string; leadId: string; service: string; date: string; amount: number; status: "Scheduled" | "Needs scheduling"; paymentStatus: "Not requested" | "Link ready" | "Paid" };
export type AnonymousMessage = { id: string; text: string; createdAt: string; source: string; publishConsent: boolean; replyByEmail: boolean; replyEmail: string; replyBySocial: boolean; socialHandle: string; status: "New" | "Reviewed" | "Published" | "Declined"; reflectionText: string };
export type Subscriber = { id: string; email: string; source: "reflections"; consentGiven: true; consentAt: string; createdAt: string };
export type WorkspaceData = { leads: Lead[]; bookings: Booking[]; messages: AnonymousMessage[]; subscribers: Subscriber[] };

export const STORAGE_KEY = "mindsupport.manager-demo.v1";
export const DEMO_CHANGE_EVENT = "mindsupport:demo-data-changed";

const seed: WorkspaceData = {
  leads: [
    { id: "LEAD-104", name: "Alex Sample", email: "alex@example.test", phone: "", source: "Manual entry", createdAt: "Today" },
    { id: "LEAD-103", name: "Jordan Example", email: "jordan@example.test", phone: "", source: "Website inquiry", createdAt: "Yesterday" },
  ],
  bookings: [
    { id: "BOOK-102", leadId: "LEAD-104", service: "50-minute session", date: "", amount: 10000, status: "Needs scheduling", paymentStatus: "Not requested" },
  ],
  messages: [],
  subscribers: [],
};

export function readDemoData(): WorkspaceData {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = JSON.parse(stored) as Partial<WorkspaceData>;
      if (Array.isArray(value.leads) && Array.isArray(value.bookings)) {
        return { leads: value.leads, bookings: value.bookings, messages: Array.isArray(value.messages) ? value.messages : [], subscribers: Array.isArray(value.subscribers) ? value.subscribers : [] };
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
