import { createHmac, timingSafeEqual } from "node:crypto";

type SignatureHeaders = {
  paystackSignature?: string;
  legacySignature?: string;
};

function safeHexEqual(expected: Buffer, providedHex: string) {
  if (!/^[0-9a-f]{128}$/i.test(providedHex)) return false;
  const provided = Buffer.from(providedHex, "hex");
  return provided.length === expected.length && timingSafeEqual(expected, provided);
}

/** Verify a Paystack webhook before parsing or trusting its JSON body. */
export function verifyPaystackSignature(
  rawBody: Buffer,
  headers: SignatureHeaders,
  secrets: { webhookSecret?: string; legacySecret?: string },
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const current = headers.paystackSignature;
  if (current && secrets.webhookSecret) {
    let timestamp: number | undefined;
    const signatures: string[] = [];
    for (const part of current.split(",")) {
      const separator = part.indexOf("=");
      if (separator < 1) continue;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key === "t") {
        if (!/^\d+$/.test(value) || timestamp !== undefined) return false;
        timestamp = Number(value);
      } else if (key === "v1") {
        const colon = value.indexOf(":");
        if (colon > 0) signatures.push(value.slice(colon + 1));
      }
    }
    if (timestamp === undefined || !Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
    if (signatures.length === 0) return false;
    const expected = createHmac("sha512", secrets.webhookSecret).update(`${timestamp}.`).update(rawBody).digest();
    return signatures.some((signature) => safeHexEqual(expected, signature));
  }

  const legacy = headers.legacySignature;
  if (!legacy || !secrets.legacySecret) return false;
  const expected = createHmac("sha512", secrets.legacySecret).update(rawBody).digest();
  return safeHexEqual(expected, legacy);
}
