import { createHmac, createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

const sessionOptions = {
  "15-minute": { service: "15-minute introductory call", durationMinutes: 15 },
  "2-hour": { service: "2-hour session", durationMinutes: 120 },
  "5-hour": { service: "5-hour session", durationMinutes: 300 },
} as const;

const circumstanceOptions = [
  "employed", "self-employed", "studying", "looking-for-work", "caring", "retired",
  "single", "partnered", "widowed", "orphaned-bereaved", "disability",
] as const;

const freeCallSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  format: z.enum(["online", "in-person", "either"]),
  availability: z.enum(["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends", "Flexible"]),
  preferredDay: z.enum(["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]).optional(),
  circumstances: z.array(z.enum(circumstanceOptions)).max(circumstanceOptions.length).default([]),
  contactConsent: z.literal(true),
  turnstileToken: z.string().max(4096).default(""),
  website: z.string().max(300).default(""),
}).strict();

const sessionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).default(""),
  tier: z.enum(["15-minute", "2-hour", "5-hour"]),
  format: z.enum(["online", "in-person", "either"]),
  availability: z.enum(["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends", "Flexible"]),
  preferredDay: z.enum(["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]).optional(),
  contactConsent: z.literal(true),
  turnstileToken: z.string().max(4096).default(""),
  website: z.string().max(300).default(""),
}).strict();

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  publishConsent: z.literal(true),
  source: z.string().trim().max(80).default("Anonymous website"),
  turnstileToken: z.string().max(4096).default(""),
  website: z.string().max(300).default(""),
}).strict();

const subscriberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
  source: z.enum(["reflections_post_submit", "reflections_feed"]).default("reflections_feed"),
  turnstileToken: z.string().max(4096).default(""),
  website: z.string().max(300).default(""),
}).strict();

const originLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait and try again." },
});

type ApiError = Error & { status?: number };
type MutationResponse = { status: number; body: Record<string, unknown>; resourceId?: string };

const requestConfirmationEmail = {
  subject: "We received your Mindsupport request",
  textBody: "Thank you for reaching out to Mindsupport. We have received your request and the team will follow up using the contact details you provided. Your call or session is not confirmed until our team contacts you and agrees a time.\n\nIf you did not submit this request, you can ignore this email.\n\nMindsupport Psychotherapy Ltd",
};

async function queueRequestConfirmation(
  tx: Prisma.TransactionClient,
  leadId: string,
  bookingId: string,
  email: string,
) {
  await tx.outboundEmail.create({ data: {
    leadId,
    bookingId,
    toEmail: email,
    idempotencyKey: `request-confirmation:${bookingId}`,
    category: "request_confirmation",
    ...requestConfirmationEmail,
  } });
}

function fail(status: number, message: string): ApiError {
  return Object.assign(new Error(message), { status });
}

function keyedPayloadHash(payload: unknown) {
  const key = process.env.IDEMPOTENCY_HMAC_KEY || process.env.DATABASE_URL || "";
  if (!key) throw new Error("Idempotency hash key is not configured.");
  const fingerprint = payload && typeof payload === "object" && !Array.isArray(payload)
    ? Object.fromEntries(Object.entries(payload).filter(([field]) => !["turnstileToken", "website"].includes(field)))
    : payload;
  return createHmac("sha256", key).update(JSON.stringify(fingerprint)).digest("hex");
}

function idempotencyKey(request: Request) {
  const value = request.get("Idempotency-Key") || randomBytes(24).toString("base64url");
  if (value.length > 128 || !/^[A-Za-z0-9._:-]{8,128}$/.test(value)) throw fail(400, "Invalid request key.");
  return value;
}

export async function idempotentMutation(
  request: Request,
  scope: string,
  payload: unknown,
  create: (tx: Prisma.TransactionClient) => Promise<MutationResponse>,
) {
  const key = idempotencyKey(request);
  const requestHash = keyedPayloadHash(payload);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.idempotencyRecord.findUnique({ where: { scope_key: { scope, key } } });
      if (existing) {
        if (existing.requestHash !== requestHash) throw fail(409, "This request key was already used for different details.");
        if (existing.response && typeof existing.response === "object" && !Array.isArray(existing.response)) {
          const body = existing.response as Record<string, unknown>;
          return { status: Number(body.httpStatus || 200), body: body.result as Record<string, unknown> };
        }
        throw fail(409, "This request is already being processed. Please retry shortly.");
      }

      await tx.idempotencyRecord.create({ data: { scope, key, requestHash, expiresAt } });
      const result = await create(tx);
      await tx.idempotencyRecord.update({
        where: { scope_key: { scope, key } },
        data: {
          resourceId: result.resourceId,
          response: { httpStatus: result.status, result: result.body } as Prisma.InputJsonValue,
        },
      });
      return result;
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const existing = await prisma.idempotencyRecord.findUnique({ where: { scope_key: { scope, key } } });
      if (existing?.requestHash === requestHash && existing.response && typeof existing.response === "object" && !Array.isArray(existing.response)) {
        const body = existing.response as Record<string, unknown>;
        return { status: Number(body.httpStatus || 200), body: body.result as Record<string, unknown> };
      }
      throw fail(409, "This request is already being processed. Please retry shortly.");
    }
    throw error;
  }
}

async function verifyTurnstile(request: Request, token: string) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return;
    throw fail(503, "Online request protection is not configured yet.");
  }
  if (!token) throw fail(400, "Please complete the security check and try again.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: controller.signal,
    });
    if (!response.ok) throw fail(503, "The security check is temporarily unavailable. Please try again.");
    const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
    if (!result.success) throw fail(400, "The security check expired. Please try again.");
    const expectedHostname = process.env.FRONTEND_ORIGIN ? new URL(process.env.FRONTEND_ORIGIN).hostname : "";
    if (!expectedHostname || result.hostname !== expectedHostname) throw fail(400, "The security check could not be verified for this site.");
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) throw error;
    throw fail(503, "The security check is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

function hiddenTrap(request: Request, response: Response) {
  if (typeof request.body?.website === "string" && request.body.website.trim()) {
    response.status(202).json({ ok: true, message: "If your request was accepted, the team will follow up." });
    return true;
  }
  return false;
}

function sendMutation(response: Response, result: MutationResponse) {
  return response.status(result.status).json(result.body);
}

export function createPublicRouter(cookieConfig: {
  secureCookie: boolean;
  sameSite: "strict" | "lax" | "none";
}) {
  const router = Router();

  router.post("/free-call", originLimit, async (request, response, next) => {
    try {
      const parsed = freeCallSchema.safeParse(request.body);
      if (!parsed.success) throw fail(400, "Check the required details and try again.");
      const input = parsed.data;
      if (hiddenTrap(request, response)) return;
      await verifyTurnstile(request, input.turnstileToken);
      const result = await idempotentMutation(request, "public.free-call", input, async (tx) => {
        const now = new Date();
        const lead = await tx.lead.create({ data: {
          name: input.name,
          email: input.email,
          source: "Free call request",
          preferredFormat: input.format,
          availability: input.availability,
          preferredDay: input.preferredDay || null,
          circumstances: input.circumstances,
          contactConsent: true,
          contactConsentAt: now,
        } });
        const booking = await tx.booking.create({ data: {
          leadId: lead.id,
          service: "Free discovery call · 15 min",
          durationMinutes: 15,
          amountKobo: null,
          status: "NEEDS_SCHEDULING",
        } });
        await queueRequestConfirmation(tx, lead.id, booking.id, lead.email);
        return { status: 201, resourceId: booking.id, body: { ok: true, requestId: booking.id, status: "received" } };
      });
      return sendMutation(response, result);
    } catch (error) { return next(error); }
  });

  router.post("/sessions", originLimit, async (request, response, next) => {
    try {
      const parsed = sessionSchema.safeParse(request.body);
      if (!parsed.success) throw fail(400, "Check the required details and try again.");
      const input = parsed.data;
      if (hiddenTrap(request, response)) return;
      await verifyTurnstile(request, input.turnstileToken);
      const tier = sessionOptions[input.tier];
      const result = await idempotentMutation(request, "public.direct-session", input, async (tx) => {
        const now = new Date();
        const lead = await tx.lead.create({ data: {
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          source: "Direct session request",
          preferredFormat: input.format,
          availability: input.availability,
          preferredDay: input.preferredDay || null,
          contactConsent: true,
          contactConsentAt: now,
        } });
        const booking = await tx.booking.create({ data: {
          leadId: lead.id,
          service: tier.service,
          durationMinutes: tier.durationMinutes,
          amountKobo: null,
          status: "NEEDS_SCHEDULING",
        } });
        await queueRequestConfirmation(tx, lead.id, booking.id, lead.email);
        return { status: 201, resourceId: booking.id, body: { ok: true, requestId: booking.id, status: "received" } };
      });
      return sendMutation(response, result);
    } catch (error) { return next(error); }
  });

  router.post("/messages", originLimit, async (request, response, next) => {
    try {
      const parsed = messageSchema.safeParse(request.body);
      if (!parsed.success) throw fail(400, "Write a message and confirm the sharing consent.");
      const input = parsed.data;
      if (hiddenTrap(request, response)) return;
      await verifyTurnstile(request, input.turnstileToken);
      const result = await idempotentMutation(request, "public.anonymous-message", input, async (tx) => {
        const now = new Date();
        const message = await tx.anonymousMessage.create({ data: {
          text: input.text,
          campaignSource: input.source.slice(0, 80),
          publishConsent: true,
          consentAt: now,
          status: "NEW",
        } });
        return { status: 201, resourceId: message.id, body: { ok: true, requestId: message.id, status: "received" } };
      });
      return sendMutation(response, result);
    } catch (error) { return next(error); }
  });

  router.post("/subscribers", originLimit, async (request, response, next) => {
    try {
      const parsed = subscriberSchema.safeParse(request.body);
      if (!parsed.success) throw fail(400, "Enter a valid email and confirm the opt-in.");
      const input = parsed.data;
      if (hiddenTrap(request, response)) return;
      await verifyTurnstile(request, input.turnstileToken);
      const result = await idempotentMutation(request, "public.reflections-subscriber", input, async (tx) => {
        const now = new Date();
        const subscriber = await tx.subscriber.upsert({
          where: { email: input.email },
          create: { email: input.email, source: input.source, consentGiven: true, consentAt: now },
          update: { source: input.source, consentGiven: true, consentAt: now, unsubscribedAt: null },
        });
        return { status: 201, resourceId: subscriber.id, body: { ok: true, status: "saved", welcomeEmail: "not_configured" } };
      });
      return sendMutation(response, result);
    } catch (error) { return next(error); }
  });

  router.get("/reflections", async (request, response, next) => {
    try {
      const visitorToken = getReflectionVisitorToken(request, response, cookieConfig);
      const messages = await prisma.anonymousMessage.findMany({
        where: { status: "PUBLISHED", reflectionText: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          reflectionText: true,
          createdAt: true,
          _count: { select: { likes: true } },
        },
      });
      const visible = messages.filter((message) => Boolean(message.reflectionText?.trim()));
      const likedRows = visible.length ? await prisma.reflectionLike.findMany({
        where: {
          messageId: { in: visible.map((message) => message.id) },
          visitorKeyHash: { in: visible.map((message) => reflectionVisitorHash(visitorToken, message.id)) },
        },
        select: { messageId: true },
      }) : [];
      const likedIds = new Set(likedRows.map((row) => row.messageId));
      return response.json({ reflections: visible.map((message) => ({
        id: message.id,
        text: message.reflectionText,
        createdAt: message.createdAt.toISOString(),
        likes: message._count.likes,
        liked: likedIds.has(message.id),
      })) });
    } catch (error) { return next(error); }
  });

  router.post("/reflections/:id/like", async (request, response, next) => {
    try {
      const messageId = z.string().uuid().safeParse(request.params.id);
      const liked = z.boolean().safeParse(request.body?.liked);
      if (!messageId.success || !liked.success) throw fail(400, "Invalid reflection action.");
      const message = await prisma.anonymousMessage.findFirst({
        where: { id: messageId.data, status: "PUBLISHED", reflectionText: { not: null } },
        select: { id: true },
      });
      if (!message) throw fail(404, "Reflection not found.");

      const visitorToken = getReflectionVisitorToken(request, response, cookieConfig);
      const visitorKeyHash = reflectionVisitorHash(visitorToken, messageId.data);
      if (liked.data) {
        await prisma.reflectionLike.upsert({
          where: { messageId_visitorKeyHash: { messageId: messageId.data, visitorKeyHash } },
          create: { messageId: messageId.data, visitorKeyHash },
          update: {},
        });
      } else {
        await prisma.reflectionLike.deleteMany({ where: { messageId: messageId.data, visitorKeyHash } });
      }
      const likes = await prisma.reflectionLike.count({ where: { messageId: messageId.data } });
      return response.json({ likes, liked: liked.data });
    } catch (error) { return next(error); }
  });

  return router;
}

function getReflectionVisitorToken(
  request: Request,
  response: Response,
  cookieConfig: { secureCookie: boolean; sameSite: "strict" | "lax" | "none" },
) {
  const cookieName = "ms_reflection_visitor";
  const current = request.cookies?.[cookieName];
  if (typeof current === "string" && /^[A-Za-z0-9_-]{40,64}$/.test(current)) return current;
  const token = randomBytes(32).toString("base64url");
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: cookieConfig.secureCookie,
    sameSite: cookieConfig.sameSite,
    path: "/api/public/reflections",
    maxAge: 365 * 24 * 60 * 60_000,
  });
  return token;
}

function reflectionVisitorHash(token: string, messageId: string) {
  return createHash("sha256").update(`${token}:${messageId}`).digest("hex");
}

export function publicApiErrorHandler(error: unknown, _request: Request, response: Response) {
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
  if (status >= 500) console.error("Public API request failed");
  const message = error instanceof Error && status < 500 ? error.message : "An unexpected error occurred. Please try again later.";
  return response.status(status).json({ error: message });
}
