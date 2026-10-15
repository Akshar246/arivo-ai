const test = require("node:test");
const assert = require("node:assert/strict");
process.env.JWT_SECRET = "test-secret-" + "x".repeat(40);
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const { fakeReq, fakeRes } = require("./helpers");

// Replace the service that talks to the database and the AI service, so only the controller logic runs
let ranAll = 0;
const servicePath = require.resolve("../services/scoutService");
require("../services/scoutService");
const real = require.cache[servicePath].exports;
require.cache[servicePath].exports = { ...real, runAll: async () => (ranAll += 1, {}) };
const User = require("../models/User");
const controller = require("../controllers/scoutController");

const SECRET = crypto.randomBytes(24).toString("hex");

test("the scheduler endpoint refuses a missing, wrong or too-short secret", () => {
  process.env.CRON_SECRET = SECRET;
  const attempt = (given) => {
    const res = fakeRes();
    controller.run(fakeReq({ headers: given === undefined ? {} : { "x-cron-secret": given } }), res);
    return res.statusCode;
  };
  assert.equal(attempt(undefined), 403);
  assert.equal(attempt("wrong"), 403);
  assert.equal(attempt("x".repeat(SECRET.length)), 403); // same length, wrong value
  process.env.CRON_SECRET = "short";
  assert.equal(attempt("short"), 403); // a short secret is never accepted, even if it matches
  assert.equal(ranAll, 0);
});

test("the scheduler endpoint accepts the right secret and answers immediately", async () => {
  process.env.CRON_SECRET = SECRET;
  const res = fakeRes();
  controller.run(fakeReq({ headers: { "x-cron-secret": SECRET }, protocol: "https", get(h) { return h === "host" ? "api.example.test" : this.headers[h.toLowerCase()]; } }), res);
  assert.equal(res.statusCode, 202);
  await new Promise((r) => setImmediate(r));
  assert.equal(ranAll, 1);
});

test("the unsubscribe link switches the Scout off", async () => {
  let update;
  User.updateOne = async (...args) => (update = args);
  const token = jwt.sign({ id: "u1", purpose: "scout-off" }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const res = fakeRes();
  await controller.unsubscribe(fakeReq({ query: { token } }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(update[1], { $set: { "scout.enabled": false } });
});

test("a normal login token cannot be used as an unsubscribe link, and garbage is refused", async () => {
  User.updateOne = async () => assert.fail("must not update");
  for (const token of [jwt.sign({ id: "u1" }, process.env.JWT_SECRET), "garbage", ""]) {
    const res = fakeRes();
    await controller.unsubscribe(fakeReq({ query: { token } }), res);
    assert.equal(res.statusCode, 400);
  }
});

test("the digest email escapes HTML in titles, companies and quotes", () => {
  const evil = '<script>alert(1)</script>';
  const picks = [{ title: evil, company: 'Acme "Ltd"', location: "London", reason: "Fits", wording: { status: "sponsorship_offered", quote: "We <b>can</b> sponsor" }, wordingBasis: "full", salaryCheck: { label: "Clears £41,700" }, url: "https://example.test/job?a=1&b=2" }];
  const { html, text } = real.buildDigest({ name: "Priya" }, picks, 1, "https://api.example.test/unsub?token=abc", "https://app.example.test");
  assert.ok(!html.includes("<script>"), "script tag must not appear");
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<b>can</b>"));
  assert.ok(html.includes("&amp;b=2"));
  assert.ok(text.includes("https://api.example.test/unsub?token=abc"));
  assert.ok(/not immigration advice/i.test(text));
  assert.ok(text.includes("skipped 1 role"));
});
