/**
 * Mindsupport downstream Sheets/Gmail receiver.
 *
 * This script is intentionally not a payment authority. Only the Railway API
 * may send booking.paid after Paystack verification and a committed DB update.
 * Anonymous-message events are deliberately unsupported.
 */

const SHEET_NAMES = {
  leads: "FreeCallLeads",
  paid: "PaidBookings",
  recovery: "AbandonedCheckoutRecovery",
  receipts: "WebhookReceipts",
};

const HEADERS = {
  FreeCallLeads: [
    "Event ID", "Created At", "Lead ID", "Lead Type", "Name", "Email", "Phone",
    "Concern Tags", "Source", "UTM Source", "UTM Medium", "UTM Campaign",
    "Referrer Host", "Verified Client IP (optional; restricted)",
  ],
  PaidBookings: [
    "Event ID", "Verified At", "Booking ID", "Paystack Reference", "Amount (kobo)",
    "Currency", "Service", "Duration (minutes)", "Scheduled Start (ISO)",
    "Client Name", "Email", "Phone", "Source",
    "Verified Client IP (optional; restricted)",
  ],
  AbandonedCheckoutRecovery: [
    "Event ID", "Checkout Created At", "Recovery Sent At", "Booking ID",
    "Amount (kobo)", "Currency", "Service", "Email Delivery Status",
  ],
  WebhookReceipts: [
    "Event ID", "Event Type", "Occurred At", "Received At", "Record Status",
    "Notification Status", "Last Error", "Completed At", "Payload SHA256",
  ],
};

const PROPERTY_KEYS = {
  spreadsheetId: "SPREADSHEET_ID",
  webhookSecret: "WEBHOOK_SECRET",
  adminEmail: "ADMIN_EMAIL",
};

const MAX_BODY_BYTES = 16 * 1024;
const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
const MIN_RECOVERY_AGE_MS = 30 * 60 * 1000;

/** Run once from the Apps Script editor to create and initialize the workbook. */
function setupMindsupportSheets() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(PROPERTY_KEYS.spreadsheetId);
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create("Mindsupport - Booking and Lead Ledger");
    spreadsheetId = spreadsheet.getId();
    properties.setProperty(PROPERTY_KEYS.spreadsheetId, spreadsheetId);
  }

  Object.keys(HEADERS).forEach(function (name) {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight("bold");
    }
  });

  const firstSheet = spreadsheet.getSheets()[0];
  if (firstSheet.getName() === "Sheet1" && firstSheet.getLastRow() === 0) {
    spreadsheet.deleteSheet(firstSheet);
  }

  console.log("Mindsupport workbook ready: " + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

/** Google Apps Script web-app entry point. */
function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    const rawBody = event && event.postData && event.postData.contents;
    if (typeof rawBody !== "string" || Utilities.newBlob(rawBody).getBytes().length > MAX_BODY_BYTES) {
      return jsonResponse_({ ok: false, error: "invalid_request" });
    }

    const envelope = JSON.parse(rawBody);
    validateEnvelope_(envelope);
    if (!lock.tryLock(5000)) throw new Error("busy");
    try {
      verifySignature_(envelope);
      const spreadsheet = getSpreadsheet_();
      const receiptSheet = spreadsheet.getSheetByName(SHEET_NAMES.receipts);
      const receipt = findEventRow_(receiptSheet, envelope.eventId);
      const payloadHash = sha256Base64Url_(canonicalJson_({
        eventType: envelope.eventType,
        occurredAt: envelope.occurredAt,
        data: envelope.data,
      }));
      const receiptRow = receipt ? receipt.row : appendReceipt_(receiptSheet, envelope, payloadHash);
      if (receipt && receiptSheet.getRange(receiptRow, 9).getValue() !== payloadHash) {
        throw new Error("event_id_payload_mismatch");
      }

      processEvent_(spreadsheet, receiptSheet, receiptRow, envelope);
      return jsonResponse_({ ok: true, eventId: envelope.eventId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    // Never return the signature, secret, request body, or personal data.
    const message = error && error.message ? String(error.message) : "request_failed";
    console.warn("Mindsupport webhook rejected/failed: " + message);
    return jsonResponse_({ ok: false, error: safeErrorCode_(message) });
  }
}

function validateEnvelope_(envelope) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) throw new Error("invalid_envelope");
  if (!/^[-A-Za-z0-9_:]{8,120}$/.test(envelope.eventId || "")) throw new Error("invalid_event_id");
  if (!["lead.created", "booking.paid", "payment.abandoned"].includes(envelope.eventType)) {
    throw new Error("unsupported_event_type");
  }
  if (!Number.isSafeInteger(envelope.timestamp)) throw new Error("invalid_timestamp");
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(envelope.nonce || "")) throw new Error("invalid_nonce");
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(envelope.occurredAt || "")) {
    throw new Error("invalid_occurred_at");
  }
  if (!envelope.data || typeof envelope.data !== "object" || Array.isArray(envelope.data)) {
    throw new Error("invalid_data");
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(envelope.signature || "")) throw new Error("invalid_signature");
}

function verifySignature_(envelope) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - envelope.timestamp) > MAX_CLOCK_SKEW_SECONDS) throw new Error("stale_request");

  const cache = CacheService.getScriptCache();
  const nonceKey = "nonce:" + sha256Base64Url_(envelope.nonce);
  if (cache.get(nonceKey)) throw new Error("replayed_request");

  const secret = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.webhookSecret);
  if (!secret || secret.length < 32) throw new Error("webhook_not_configured");

  const signedText = [
    String(envelope.timestamp), envelope.nonce, envelope.eventId, envelope.eventType,
    envelope.occurredAt, canonicalJson_(envelope.data),
  ].join("\n");
  const expected = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(signedText, secret, Utilities.Charset.UTF_8),
  ).replace(/=+$/, "");

  if (!constantTimeEqual_(expected, envelope.signature)) throw new Error("invalid_signature");
  cache.put(nonceKey, "1", 300);
}

function processEvent_(spreadsheet, receiptSheet, receiptRow, envelope) {
  const status = receiptSheet.getRange(receiptRow, 5, 1, 3).getValues()[0];
  let recordStatus = status[0] || "pending";
  let notificationStatus = status[1] || "pending";
  let lastError = "";

  try {
    if (recordStatus !== "complete") {
      appendEventRecordOnce_(spreadsheet, envelope);
      recordStatus = "complete";
    }
  } catch (error) {
    recordStatus = "failed";
    lastError = error && error.message ? String(error.message) : "record_write_failed";
  }

  if (recordStatus === "complete" && notificationStatus !== "sent") {
    try {
      notificationStatus = sendNotification_(envelope) ? "sent" : "not_configured";
    } catch (error) {
      notificationStatus = "failed";
      lastError = error && error.message ? String(error.message) : "notification_failed";
    }
  }

  const complete = recordStatus === "complete" && ["sent", "not_configured"].includes(notificationStatus);
  receiptSheet.getRange(receiptRow, 5, 1, 4).setValues([[
    recordStatus, notificationStatus, safeCell_(lastError), complete ? new Date() : "",
  ]]);
  if (envelope.eventType === "payment.abandoned" && recordStatus === "complete") {
    const recoverySheet = spreadsheet.getSheetByName(SHEET_NAMES.recovery);
    const recovery = findEventRow_(recoverySheet, envelope.eventId);
    if (recovery) recoverySheet.getRange(recovery.row, 8).setValue(notificationStatus);
  }

  if (recordStatus !== "complete") throw new Error("record_write_failed");
  if (notificationStatus === "failed") throw new Error("notification_failed");
}

function appendEventRecordOnce_(spreadsheet, envelope) {
  const data = envelope.data;
  let name;
  let row;

  if (envelope.eventType === "lead.created") {
    validateLead_(data);
    name = SHEET_NAMES.leads;
    row = [
      envelope.eventId, envelope.occurredAt, safeCell_(data.leadId), safeCell_(data.leadType),
      safeCell_(data.name), safeCell_(data.email), safeCell_(data.phone || ""),
      safeCell_((data.concernTags || []).join(", ")), safeCell_(data.source || ""),
      safeCell_((data.utm && data.utm.source) || ""), safeCell_((data.utm && data.utm.medium) || ""),
      safeCell_((data.utm && data.utm.campaign) || ""), safeCell_((data.utm && data.utm.referrerHost) || ""),
      safeCell_(data.verifiedClientIp || ""),
    ];
  } else if (envelope.eventType === "booking.paid") {
    validatePaidBooking_(data);
    name = SHEET_NAMES.paid;
    row = [
      envelope.eventId, envelope.occurredAt, safeCell_(data.bookingId), safeCell_(data.paymentReference),
      data.amountKobo, data.currency, safeCell_(data.service), data.durationMinutes,
      safeCell_(data.scheduledAt || ""), safeCell_(data.name), safeCell_(data.email),
      safeCell_(data.phone || ""), safeCell_(data.source || ""), safeCell_(data.verifiedClientIp || ""),
    ];
  } else {
    validateAbandonedPayment_(data, envelope.timestamp);
    name = SHEET_NAMES.recovery;
    row = [
      envelope.eventId, safeCell_(data.checkoutCreatedAt), new Date(), safeCell_(data.bookingId),
      data.amountKobo, data.currency, safeCell_(data.service), "pending",
    ];
  }

  const sheet = spreadsheet.getSheetByName(name);
  if (!findEventRow_(sheet, envelope.eventId)) sheet.appendRow(row);
}

function validateLead_(data) {
  requireText_(data.leadId, 120, "lead_id");
  if (data.leadType !== "free_call") throw new Error("invalid_lead_type");
  requireText_(data.name, 100, "name");
  requireEmail_(data.email);
  optionalText_(data.phone, 40, "phone");
  optionalText_(data.source, 80, "source");
  if (data.concernTags !== undefined && (!Array.isArray(data.concernTags) || data.concernTags.length > 12)) {
    throw new Error("invalid_concern_tags");
  }
  (data.concernTags || []).forEach(function (tag) { requireText_(tag, 40, "concern_tag"); });
  if (data.utm !== undefined) {
    if (!data.utm || typeof data.utm !== "object" || Array.isArray(data.utm)) throw new Error("invalid_utm");
    ["source", "medium", "campaign", "referrerHost"].forEach(function (key) {
      optionalText_(data.utm[key], 120, "utm_" + key);
    });
  }
  optionalIp_(data.verifiedClientIp);
}

function validatePaidBooking_(data) {
  requireText_(data.bookingId, 120, "booking_id");
  requireText_(data.paymentReference, 100, "payment_reference");
  requireText_(data.name, 100, "name");
  requireEmail_(data.email);
  optionalText_(data.phone, 40, "phone");
  optionalText_(data.source, 80, "source");
  requireText_(data.service, 120, "service");
  if (data.currency !== "NGN") throw new Error("invalid_currency");
  if (!Number.isSafeInteger(data.amountKobo) || data.amountKobo <= 0) throw new Error("invalid_amount");
  const tierAmounts = { 50: 1000000, 120: 3000000, 300: 7000000 };
  if (!Object.prototype.hasOwnProperty.call(tierAmounts, data.durationMinutes) ||
      tierAmounts[data.durationMinutes] !== data.amountKobo) throw new Error("invalid_session_tier");
  if (data.scheduledAt !== undefined && data.scheduledAt !== null &&
      (typeof data.scheduledAt !== "string" || !Number.isFinite(Date.parse(data.scheduledAt)))) {
    throw new Error("invalid_schedule");
  }
  optionalIp_(data.verifiedClientIp);
}

function validateAbandonedPayment_(data, envelopeTimestamp) {
  requireText_(data.bookingId, 120, "booking_id");
  requireText_(data.service, 120, "service");
  requireText_(data.name, 100, "name");
  requireEmail_(data.email);
  if (data.currency !== "NGN" || !Number.isSafeInteger(data.amountKobo) || data.amountKobo <= 0) {
    throw new Error("invalid_amount_or_currency");
  }
  if (data.recoveryEmailConsent !== true) throw new Error("recovery_email_not_authorized");
  if (typeof data.checkoutCreatedAt !== "string" || !Number.isFinite(Date.parse(data.checkoutCreatedAt))) {
    throw new Error("invalid_checkout_time");
  }
  const checkoutAge = envelopeTimestamp * 1000 - Date.parse(data.checkoutCreatedAt);
  if (checkoutAge < MIN_RECOVERY_AGE_MS || checkoutAge > 30 * 24 * 60 * 60 * 1000) {
    throw new Error("checkout_not_recoverable");
  }
  let checkoutUrl;
  try { checkoutUrl = new URL(data.checkoutUrl); } catch (_error) { throw new Error("invalid_checkout_url"); }
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.username || checkoutUrl.password ||
      checkoutUrl.toString().length > 2048 || !/(^|\.)paystack\.com$/i.test(checkoutUrl.hostname)) {
    throw new Error("invalid_checkout_url");
  }
}

function sendNotification_(envelope) {
  const properties = PropertiesService.getScriptProperties();
  const adminEmail = properties.getProperty(PROPERTY_KEYS.adminEmail);
  const data = envelope.data;

  if (envelope.eventType === "payment.abandoned") {
    if (data.recoveryEmailConsent !== true) return false;
    const checkoutUrl = new URL(data.checkoutUrl);
    MailApp.sendEmail({
      to: data.email,
      subject: "Your Mindsupport session checkout",
      body: "Hello " + data.name + ",\n\nYour session checkout is still available if you would like to continue: " +
        checkoutUrl.toString() + "\n\nIf you have already paid, you can ignore this note.\n\nMindsupport",
      htmlBody: "<p>Hello " + escapeHtml_(data.name) + ",</p><p>Your session checkout is still available if you would like to continue.</p>" +
        "<p><a href=\"" + escapeHtml_(checkoutUrl.toString()) + "\">Return to your secure checkout</a></p>" +
        "<p>If you have already paid, you can ignore this note.</p><p>Mindsupport</p>",
      name: "Mindsupport",
    });
    return true;
  }

  if (!adminEmail) return false;
  requireEmail_(adminEmail);
  const isPaid = envelope.eventType === "booking.paid";
  const subject = isPaid ? "[Mindsupport] Paid session booking" : "[Mindsupport] New free call lead";
  const summary = isPaid
    ? "Verified payment " + data.paymentReference + " for booking " + data.bookingId + " (" + data.currency + " " + data.amountKobo + " kobo)."
    : "New free call lead " + data.leadId + " from " + data.source + ".";
  MailApp.sendEmail({ to: adminEmail, subject: subject, body: summary, name: "Mindsupport" });
  return true;
}

function appendReceipt_(sheet, envelope, payloadHash) {
  sheet.appendRow([
    envelope.eventId, envelope.eventType, envelope.occurredAt, new Date(),
    "pending", "pending", "", "", payloadHash,
  ]);
  return sheet.getLastRow();
}

function findEventRow_(sheet, eventId) {
  if (sheet.getLastRow() < 2) return null;
  const match = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(eventId).matchEntireCell(true).findNext();
  return match ? { row: match.getRow() } : null;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEYS.spreadsheetId);
  if (!id) throw new Error("sheets_not_initialized");
  return SpreadsheetApp.openById(id);
}

function canonicalJson_(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson_).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + canonicalJson_(value[key]);
    }).join(",") + "}";
  }
  throw new Error("invalid_json_value");
}

function sha256Base64Url_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8),
  ).replace(/=+$/, "");
}

function constantTimeEqual_(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

function requireText_(value, maxLength, label) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new Error("invalid_" + label);
}

function optionalText_(value, maxLength, label) {
  if (value !== undefined && value !== null && (typeof value !== "string" || value.length > maxLength)) {
    throw new Error("invalid_" + label);
  }
}

function requireEmail_(value) {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("invalid_email");
  }
}

function optionalIp_(value) {
  if (value === undefined || value === null || value === "") return;
  if (typeof value !== "string" || value.length > 45 || !/^[0-9a-fA-F:.]+$/.test(value)) {
    throw new Error("invalid_client_ip");
  }
}

/** Prefix formula-leading strings to prevent untrusted values becoming cells/formulas. */
function safeCell_(value) {
  const text = String(value == null ? "" : value).replace(/[\u0000-\u001F\u007F]/g, " ");
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
  });
}

function safeErrorCode_(message) {
  return /^[a-z_]{3,50}$/.test(message) ? message : "request_failed";
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
