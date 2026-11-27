import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyPaystackSignature } from "../src/paystack-signature.js";

const secret = "whsec_test_only";
const now = 1_800_000_000;
const body = Buffer.from('{"event":"charge.success","data":{"reference":"test-ref","amount":1000000}}');

function timestampedSignature(payload: Buffer, timestamp = now) {
  const signature = createHmac("sha512", secret).update(`${timestamp}.`).update(payload).digest("hex");
  return `t=${timestamp},v1=whk_test:${signature}`;
}

test("accepts a fresh Paystack signature over the exact raw body", () => {
  assert.equal(verifyPaystackSignature(body, { paystackSignature: timestampedSignature(body) }, { webhookSecret: secret }, now), true);
});

test("rejects a body changed after signature creation", () => {
  assert.equal(verifyPaystackSignature(Buffer.from(`${body.toString()} `), { paystackSignature: timestampedSignature(body) }, { webhookSecret: secret }, now), false);
});

test("rejects stale signatures and malformed digest lengths", () => {
  assert.equal(verifyPaystackSignature(body, { paystackSignature: timestampedSignature(body, now - 301) }, { webhookSecret: secret }, now), false);
  assert.equal(verifyPaystackSignature(body, { paystackSignature: `t=${now},v1=whk_test:abcd` }, { webhookSecret: secret }, now), false);
});

test("accepts a matching signature during key rotation and ignores unrelated fields", () => {
  const valid = timestampedSignature(body).split(",")[1];
  const header = `ignored=value,t=${now},v1=whk_old:${"0".repeat(128)},${valid}`;
  assert.equal(verifyPaystackSignature(body, { paystackSignature: header }, { webhookSecret: secret }, now), true);
});

test("accepts the legacy raw-body signature only when supplied with the legacy secret", () => {
  const legacySecret = "sk_test_only";
  const signature = createHmac("sha512", legacySecret).update(body).digest("hex");
  assert.equal(verifyPaystackSignature(body, { legacySignature: signature }, { legacySecret }, now), true);
  assert.equal(verifyPaystackSignature(body, { legacySignature: signature }, { legacySecret: "wrong" }, now), false);
});
