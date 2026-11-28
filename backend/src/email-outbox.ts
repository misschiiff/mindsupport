import { prisma } from "./db.js";

const MAX_ATTEMPTS = 6;
const retryDelaysMs = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 4 * 60 * 60_000];
const pollIntervalMs = 10_000;
const sendingLeaseMs = 5 * 60_000;
let workerRunning = false;

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function htmlFromText(text: string) {
  return text.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
}

async function deliverOne() {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - sendingLeaseMs);
  const email = await prisma.outboundEmail.findFirst({
    where: {
      OR: [
        { status: "PENDING", nextAttemptAt: { lte: now } },
        { status: "FAILED", attemptCount: { lt: MAX_ATTEMPTS }, nextAttemptAt: { lte: now } },
        { status: "SENDING", updatedAt: { lte: staleBefore } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  if (!email) return false;

  const claim = await prisma.outboundEmail.updateMany({
    where: { id: email.id, status: email.status, updatedAt: email.updatedAt },
    data: { status: "SENDING", attemptCount: { increment: 1 }, lastAttemptAt: now },
  });
  if (claim.count !== 1) return true;

  const attempt = email.attemptCount + 1;
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !sender) throw Object.assign(new Error("email_provider_not_configured"), { code: "email_provider_not_configured" });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "idempotency-key": `mindsupport-outbound-${email.id}`,
      },
      body: JSON.stringify({
        from: `Mindsupport <${sender}>`,
        to: [email.toEmail],
        subject: email.subject,
        text: email.textBody,
        html: htmlFromText(email.textBody),
        ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw Object.assign(new Error("resend_request_failed"), { code: `resend_http_${response.status}` });

    await prisma.outboundEmail.update({
      where: { id: email.id },
      data: { status: "SENT", sentAt: new Date(), lastErrorCode: null },
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code.slice(0, 80)
      : "resend_network_error";
    const delay = retryDelaysMs[Math.min(attempt - 1, retryDelaysMs.length - 1)];
    await prisma.outboundEmail.update({
      where: { id: email.id },
      data: {
        status: "FAILED",
        lastErrorCode: code,
        nextAttemptAt: attempt < MAX_ATTEMPTS ? new Date(Date.now() + delay) : new Date("9999-12-31T23:59:59.999Z"),
      },
    });
  }
  return true;
}

export function startEmailOutboxWorker() {
  const poll = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
      for (let count = 0; count < 10 && await deliverOne(); count += 1) { /* drain a small batch */ }
    } catch {
      console.error("Email outbox worker could not process the queue.");
    } finally {
      workerRunning = false;
    }
  };
  void poll();
  const timer = setInterval(() => void poll(), pollIntervalMs);
  timer.unref();
}
