const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const mailer = require("../utils/mailer");
const { aiHeaders } = require("../utils/aiHeaders");

const clean = () => ["MAIL_RELAY_URL", "MAIL_RELAY_SECRET", "RESEND_API_KEY", "NODE_ENV"].forEach((k) => delete process.env[k]);

test("with nothing configured nothing is sent", async () => {
  clean();
  const log = console.log;
  console.log = () => {};
  try {
    assert.deepEqual(await mailer.sendMail({ to: "a@b.c", subject: "s", text: "t" }), { sent: false });
  } finally {
    console.log = log;
  }
});

test("the relay is used when configured, and pasted quotes and spaces in settings are ignored", async () => {
  clean();
  process.env.MAIL_RELAY_URL = ' "https://script.example.test/exec" ';
  process.env.MAIL_RELAY_SECRET = "s".repeat(24);
  let call;
  axios.post = async (url, body) => ((call = { url, body }), { data: { ok: true } });
  const out = await mailer.sendMail({ to: "a@b.c", subject: "s", text: "t" });
  assert.deepEqual(out, { sent: true, via: "relay" });
  assert.equal(call.url, "https://script.example.test/exec");
  assert.equal(call.body.secret, "s".repeat(24));
});

test("a refusal from the relay is reported, not treated as sent", async () => {
  clean();
  process.env.MAIL_RELAY_URL = "https://script.example.test/exec";
  process.env.MAIL_RELAY_SECRET = "s".repeat(24);
  axios.post = async () => ({ data: { ok: false, error: "forbidden" } });
  await assert.rejects(mailer.sendMail({ to: "a@b.c", subject: "s", text: "t" }), /refused/);
});

test("a name containing HTML cannot inject markup into the reset or confirmation email", async () => {
  clean();
  process.env.MAIL_RELAY_URL = "https://script.example.test/exec";
  process.env.MAIL_RELAY_SECRET = "s".repeat(24);
  const sent = [];
  axios.post = async (url, body) => (sent.push(body), { data: { ok: true } });
  const user = { name: '<img src=x onerror=alert(1)>', email: "a@b.c" };
  await mailer.sendVerificationEmail(user, "tok");
  await mailer.sendResetEmail(user, "tok");
  assert.equal(sent.length, 2);
  for (const m of sent) {
    assert.ok(!m.html.includes("<img src=x"), "raw tag must not appear in the HTML body");
    assert.ok(m.html.includes("&lt;img"));
  }
});

test("the backend sends the AI service key only when it is configured", () => {
  delete process.env.AI_SERVICE_KEY;
  assert.deepEqual(aiHeaders(), {});
  process.env.AI_SERVICE_KEY = "k".repeat(20);
  assert.deepEqual(aiHeaders(), { "x-service-key": "k".repeat(20) });
  delete process.env.AI_SERVICE_KEY;
});
