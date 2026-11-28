import { createHmac, randomBytes } from "node:crypto";

export type AppsScriptEventType = "lead.created" | "booking.paid" | "payment.abandoned";

export type AppsScriptEvent = {
  eventId: string;
  eventType: AppsScriptEventType;
  occurredAt: string;
  data: Record<string, unknown>;
};

type SignedEnvelope = AppsScriptEvent & {
  timestamp: number;
  nonce: string;
  signature: string;
};

/** Canonical JSON shared with Code.gs: recursively sort object keys. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new TypeError("Webhook payload contains a non-JSON value.");
    return serialized;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new TypeError("Webhook payload contains a non-JSON value.");
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  throw new TypeError("Webhook payload contains a non-JSON value.");
}

export function signAppsScriptEvent(
  event: AppsScriptEvent,
  secret: string,
  options: { timestamp?: number; nonce?: string } = {},
): SignedEnvelope {
  if (secret.length < 32) throw new Error("Google Apps Script webhook secret must be at least 32 characters.");
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
  const nonce = options.nonce ?? randomNonce();
  const signedText = [
    String(timestamp), nonce, event.eventId, event.eventType, event.occurredAt,
    canonicalJson(event.data),
  ].join("\n");
  const signature = createHmac("sha256", secret).update(signedText, "utf8").digest("base64url");
  return { ...event, timestamp, nonce, signature };
}

/**
 * Send one already-committed outbox event to Apps Script.
 * This helper is deliberately not wired into routes until the outbox exists.
 */
export async function deliverAppsScriptEvent(input: {
  endpoint: string;
  secret: string;
  event: AppsScriptEvent;
  timeoutMs?: number;
}): Promise<void> {
  const endpoint = new URL(input.endpoint);
  if (endpoint.protocol !== "https:" || endpoint.hostname !== "script.google.com" ||
      !endpoint.pathname.startsWith("/macros/s/") || !endpoint.pathname.endsWith("/exec")) {
    throw new Error("Apps Script endpoint must be a deployed HTTPS Google Apps Script web-app URL.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(signAppsScriptEvent(input.event, input.secret)),
    signal: AbortSignal.timeout(input.timeoutMs ?? 10_000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Apps Script returned HTTP ${response.status}.`);

  let result: { ok?: boolean; error?: string };
  try {
    result = await response.json() as { ok?: boolean; error?: string };
  } catch {
    throw new Error("Apps Script returned a non-JSON response.");
  }
  if (result.ok !== true) throw new Error(`Apps Script rejected the event (${result.error || "unknown_error"}).`);
}

function randomNonce(): string {
  return randomBytes(32).toString("base64url");
}
