import test from "node:test";
import assert from "node:assert/strict";
import { validateAnonymousMessage, validateBooking, validateBookingStep } from "../app/lib/form-validation.mjs";

const validBooking = { name: "Jamie", email: "jamie@example.com", format: "online", availability: "Weekday evenings", consent: "on" };

test("valid booking request passes with each supported meeting format", () => {
  for (const format of ["online", "in-person", "either"]) {
    assert.equal(validateBooking({ ...validBooking, format }), "");
  }
});

test("booking requires valid contact, format, availability, and follow-up consent", () => {
  assert.match(validateBooking({ ...validBooking, email: "bad address" }), /valid email/i);
  assert.match(validateBooking({ ...validBooking, format: "video" }), /online, in person, or either/i);
  assert.match(validateBooking({ ...validBooking, availability: "" }), /time of day/i);
  assert.match(validateBooking({ ...validBooking, consent: null }), /confirm/i);
});

test("booking steps validate only the fields shown in that step", () => {
  assert.match(validateBookingStep(1, { format: "" }), /online, in person, or either/i);
  assert.equal(validateBookingStep(1, { format: "either" }), "");
  assert.match(validateBookingStep(2, { availability: "" }), /time of day/i);
  assert.equal(validateBookingStep(2, { availability: "Weekends" }), "");
  assert.match(validateBookingStep(3, { name: "", email: "", format: "online", availability: "Weekends", consent: "on" }), /name/i);
});

test("anonymous message requires publication consent before sending", () => {
  const base = { message: "I would like to talk" };
  assert.match(validateAnonymousMessage({ ...base, publishConsent: "on", message: "short" }), /few more words/i);
  assert.match(validateAnonymousMessage({ ...base, publishConsent: null }), /publication/i);
  assert.equal(validateAnonymousMessage({ ...base, publishConsent: "on" }), "");
});

test("anonymous message has no contact requirements beyond publication consent", () => {
  const base = { message: "I would like to talk", publishConsent: "on" };
  assert.equal(validateAnonymousMessage(base), "");
  assert.equal(validateAnonymousMessage({ ...base, replyByEmail: "on", email: "" }), "");
  assert.equal(validateAnonymousMessage({ ...base, replyBySocial: "on", socialHandle: " " }), "");
});
