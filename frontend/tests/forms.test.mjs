import test from "node:test";
import assert from "node:assert/strict";
import { validateAnonymousMessage, validateBooking } from "../app/lib/form-validation.mjs";

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

test("anonymous message requires a useful length and explicit acknowledgement", () => {
  assert.match(validateAnonymousMessage({ message: "short", anonymousConsent: "on" }), /few more words/i);
  assert.match(validateAnonymousMessage({ message: "I would like to talk", anonymousConsent: null }), /confirm/i);
  assert.equal(validateAnonymousMessage({ message: "I would like to talk", anonymousConsent: "on" }), "");
});
