import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "./db.js";
import { idempotentMutation } from "./public-api.js";
import { requireRole, requireStaff, type AuthConfig } from "./auth.js";

const manualLeadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  source: z.string().trim().min(1).max(80).default("Manual entry"),
  contactConsent: z.literal(true),
}).strict();

const followUpEmailSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  textBody: z.string().trim().min(1).max(4000),
}).strict();

const manualBookingSchema = z.object({
  leadId: z.string().uuid(),
  tier: z.enum(["15-minute", "2-hour", "5-hour"]),
}).strict();

const bookingUpdateSchema = z.object({
  status: z.enum(["NEEDS_SCHEDULING", "CONFIRMED", "CANCELLED"]),
  scheduledAt: z.string().datetime().optional(),
  contactedAndAgreed: z.boolean().default(false),
}).strict();

const reviewSchema = z.object({
  status: z.enum(["REVIEWED", "PUBLISHED", "DECLINED"]),
  reflectionText: z.string().trim().max(2000).optional().default(""),
}).strict();

const tiers = {
  "15-minute": { service: "15-minute introductory call", durationMinutes: 15 },
  "2-hour": { service: "2-hour session", durationMinutes: 120 },
  "5-hour": { service: "5-hour session", durationMinutes: 300 },
} as const;

export function createAdminRouter(config: AuthConfig) {
  const router = Router();
  router.use(requireStaff(config), requireRole("ADMIN", "STAFF"));

  router.get("/leads/export.csv", async (request, response, next) => {
    try {
      const leads = await prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          bookings: { orderBy: { createdAt: "asc" } },
          emails: { orderBy: { createdAt: "desc" } },
        },
      });
      const rows: unknown[][] = [[
        "Lead ID", "Name", "Email", "Phone", "Source", "Lead created at",
        "Preferred format", "Availability", "Preferred day", "Shared circumstances",
        "Contact permission", "Permission recorded at", "Session request", "Duration minutes",
        "Request status", "Agreed time", "Confirmation email status", "Latest follow-up email status",
      ]];
      const csvCell = (input: unknown) => {
        const value = input == null ? "" : Array.isArray(input) ? input.join("; ") : String(input);
        const spreadsheetSafe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
        return `"${spreadsheetSafe.replace(/"/g, '""')}"`;
      };
      for (const lead of leads) {
        const confirmation = lead.emails.find((email) => email.category === "request_confirmation");
        const followUp = lead.emails.find((email) => email.category === "staff_follow_up");
        const bookings = lead.bookings.length ? lead.bookings : [null];
        for (const booking of bookings) rows.push([
          lead.id, lead.name, lead.email, lead.phone, lead.source, lead.createdAt.toISOString(),
          lead.preferredFormat, lead.availability, lead.preferredDay, JSON.stringify(lead.circumstances ?? []),
          lead.contactConsent ? "Yes" : "No", lead.contactConsentAt?.toISOString(),
          booking?.service, booking?.durationMinutes, booking?.status, booking?.scheduledAt?.toISOString(),
          confirmation?.status, followUp?.status,
        ]);
      }
      await prisma.auditEvent.create({ data: {
        actorId: request.staff!.id, action: "leads.exported_csv", entityType: "lead",
      } });
      const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
      const dateStamp = new Date().toISOString().slice(0, 10);
      response.setHeader("Content-Type", "text/csv; charset=utf-8");
      response.setHeader("Content-Disposition", `attachment; filename="mindsupport-leads-${dateStamp}.csv"`);
      response.setHeader("Cache-Control", "no-store");
      return response.status(200).send(csv);
    } catch (error) { return next(error); }
  });

  router.get("/workspace", async (_request, response, next) => {
    try {
      const [leads, messages, subscribers] = await Promise.all([
        prisma.lead.findMany({
          orderBy: { createdAt: "desc" }, take: 300,
          include: {
            bookings: { orderBy: { createdAt: "desc" } },
            emails: { orderBy: { createdAt: "desc" }, take: 20 },
          },
        }),
        prisma.anonymousMessage.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
        prisma.subscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "desc" }, take: 300 }),
      ]);
      return response.json({
        leads: leads.map((lead) => ({
          id: lead.id, name: lead.name, email: lead.email, phone: lead.phone || "", source: lead.source,
          contactConsent: lead.contactConsent,
          createdAt: lead.createdAt.toISOString(), preferredFormat: lead.preferredFormat,
          availability: lead.availability, preferredDay: lead.preferredDay,
          circumstances: Array.isArray(lead.circumstances) ? lead.circumstances : [],
          emails: lead.emails.map((email) => ({
            id: email.id, category: email.category, subject: email.subject,
            textBody: email.textBody, status: email.status, createdAt: email.createdAt.toISOString(),
            sentAt: email.sentAt?.toISOString() || null,
          })),
        })),
        bookings: leads.flatMap((lead) => lead.bookings.map((booking) => ({
          id: booking.id, leadId: lead.id, service: booking.service,
          date: booking.scheduledAt?.toISOString() || "", status: booking.status,
        }))),
        messages: messages.map((message) => ({
          id: message.id, text: message.text, createdAt: message.createdAt.toISOString(),
          source: message.campaignSource || "Anonymous website", publishConsent: message.publishConsent,
          status: message.status, reflectionText: message.reflectionText || "",
        })),
        subscribers: subscribers.map((subscriber) => ({
          id: subscriber.id, email: subscriber.email, source: subscriber.source,
          consentGiven: subscriber.consentGiven, consentAt: subscriber.consentAt.toISOString(),
          createdAt: subscriber.createdAt.toISOString(),
        })),
      });
    } catch (error) { return next(error); }
  });

  router.post("/leads", async (request, response, next) => {
    try {
      const parsed = manualLeadSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ error: "Enter a name and valid email address." });
      const result = await idempotentMutation(request, "admin.manual-lead", parsed.data, async (tx) => {
        const lead = await tx.lead.create({ data: {
          name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone || null,
          source: parsed.data.source,
          contactConsent: true,
          contactConsentAt: new Date(),
        } });
        await tx.auditEvent.create({ data: {
          actorId: request.staff!.id, action: "lead.created_manually", entityType: "lead", entityId: lead.id,
        } });
        return { status: 201, resourceId: lead.id, body: { ok: true, id: lead.id } };
      });
      return response.status(result.status).json(result.body);
    } catch (error) { return next(error); }
  });

  router.post("/leads/:id/follow-up", async (request, response, next) => {
    try {
      const leadId = z.string().uuid().safeParse(request.params.id);
      const parsed = followUpEmailSchema.safeParse(request.body);
      if (!leadId.success || !parsed.success) return response.status(400).json({ error: "Enter an email subject and message." });
      const lead = await prisma.lead.findUnique({ where: { id: leadId.data }, select: { id: true, email: true, contactConsent: true } });
      if (!lead) return response.status(404).json({ error: "Lead not found." });
      if (!lead.contactConsent) return response.status(409).json({ error: "Contact permission has not been recorded for this lead." });
      const result = await idempotentMutation(request, "admin.lead-follow-up-email", { leadId: lead.id, ...parsed.data }, async (tx) => {
        const email = await tx.outboundEmail.create({ data: {
          leadId: lead.id,
          toEmail: lead.email,
          idempotencyKey: `staff-follow-up:${randomUUID()}`,
          category: "staff_follow_up",
          subject: parsed.data.subject,
          textBody: parsed.data.textBody,
        } });
        await tx.auditEvent.create({ data: {
          actorId: request.staff!.id, action: "lead.follow_up_email_queued",
          entityType: "lead", entityId: lead.id,
        } });
        return { status: 202, resourceId: email.id, body: { ok: true, id: email.id, status: "queued" } };
      });
      return response.status(result.status).json(result.body);
    } catch (error) { return next(error); }
  });

  router.post("/bookings", async (request, response, next) => {
    try {
      const parsed = manualBookingSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ error: "Select a lead and a session tier." });
      const result = await idempotentMutation(request, "admin.manual-booking", parsed.data, async (tx) => {
        const lead = await tx.lead.findUnique({ where: { id: parsed.data.leadId }, select: { id: true } });
        if (!lead) return Promise.reject(Object.assign(new Error("Lead not found."), { status: 404 }));
        const tier = tiers[parsed.data.tier];
        const booking = await tx.booking.create({ data: {
          leadId: lead.id, service: tier.service, durationMinutes: tier.durationMinutes,
          amountKobo: null, status: "NEEDS_SCHEDULING",
        } });
        await tx.auditEvent.create({ data: {
          actorId: request.staff!.id, action: "booking.created_manually", entityType: "booking", entityId: booking.id,
        } });
        return { status: 201, resourceId: booking.id, body: { ok: true, id: booking.id } };
      });
      return response.status(result.status).json(result.body);
    } catch (error) { return next(error); }
  });

  router.patch("/bookings/:id", async (request, response, next) => {
    try {
      const bookingId = z.string().uuid().safeParse(request.params.id);
      const parsed = bookingUpdateSchema.safeParse(request.body);
      if (!bookingId.success || !parsed.success) return response.status(400).json({ error: "Check the booking status and agreed time." });
      if (parsed.data.status === "CONFIRMED" && (!parsed.data.scheduledAt || !parsed.data.contactedAndAgreed)) {
        return response.status(400).json({ error: "Contact the client and agree a time before confirming this request." });
      }
      const current = await prisma.booking.findUnique({ where: { id: bookingId.data } });
      if (!current) return response.status(404).json({ error: "Booking request not found." });
      const updated = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.update({
          where: { id: bookingId.data },
          data: {
            status: parsed.data.status,
            scheduledAt: parsed.data.status === "CONFIRMED" ? new Date(parsed.data.scheduledAt!) : null,
          },
        });
        await tx.auditEvent.create({ data: {
          actorId: request.staff!.id, action: `booking.${parsed.data.status.toLowerCase()}`,
          entityType: "booking", entityId: booking.id,
        } });
        return booking;
      });
      return response.json({ ok: true, id: updated.id, status: updated.status, scheduledAt: updated.scheduledAt?.toISOString() || null });
    } catch (error) { return next(error); }
  });

  router.patch("/messages/:id", async (request, response, next) => {
    try {
      const messageId = z.string().uuid().safeParse(request.params.id);
      const parsed = reviewSchema.safeParse(request.body);
      if (!messageId.success || !parsed.success) return response.status(400).json({ error: "Invalid message review." });
      if (parsed.data.status === "PUBLISHED" && !parsed.data.reflectionText.trim()) {
        return response.status(400).json({ error: "Review the public reflection text before publishing." });
      }
      const current = await prisma.anonymousMessage.findUnique({ where: { id: messageId.data } });
      if (!current) return response.status(404).json({ error: "Message not found." });
      if (parsed.data.status === "PUBLISHED" && !current.publishConsent) {
        return response.status(409).json({ error: "Publication consent is not recorded." });
      }
      const updated = await prisma.$transaction(async (tx) => {
        const message = await tx.anonymousMessage.update({
          where: { id: messageId.data },
          data: {
            status: parsed.data.status,
            reflectionText: parsed.data.status === "PUBLISHED" ? parsed.data.reflectionText : current.reflectionText,
          },
        });
        await tx.auditEvent.create({ data: {
          actorId: request.staff!.id, action: `anonymous_message.${parsed.data.status.toLowerCase()}`,
          entityType: "anonymous_message", entityId: message.id,
        } });
        return message;
      });
      return response.json({ ok: true, id: updated.id, status: updated.status });
    } catch (error) { return next(error); }
  });

  router.post("/bookings/:id/payment-link", (_request, response) => {
    return response.status(503).json({ error: "Paystack checkout is not connected yet. No payment link was created." });
  });

  return router;
}

export function adminApiErrorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
  if (status >= 500) console.error("Admin API request failed");
  const message = error instanceof Error && status < 500 ? error.message : "An unexpected error occurred. Please try again later.";
  return response.status(status).json({ error: message });
}
