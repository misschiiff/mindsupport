import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, validatePassword, verifyPassword } from "../src/auth.js";

test("password policy requires sufficient length and varied characters", () => {
  assert.equal(validatePassword("short1A!"), false);
  assert.equal(validatePassword("alllowercasepassword1!"), false);
  assert.equal(validatePassword("StrongPassphrase2026!"), true);
});

test("password hashes are salted and verify only the matching password", async () => {
  const password = "StrongPassphrase2026!";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("WrongPassphrase2026!", first), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
});
