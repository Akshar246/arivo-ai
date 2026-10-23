const test = require("node:test");
const assert = require("node:assert/strict");
process.env.JWT_SECRET = "test-secret-" + "x".repeat(40);
const { fakeReq, fakeRes } = require("./helpers");

// Replace the mailer so no email is sent, and record what would have been sent
const sent = [];
const mailerPath = require.resolve("../utils/mailer");
require("../utils/mailer");
require.cache[mailerPath].exports = { ...require.cache[mailerPath].exports, sendMail: async (m) => (sent.push(m), { sent: true }) };

const User = require("../models/User");
const Feedback = require("../models/Feedback");
const { create } = require("../controllers/feedbackController");

const stored = [];
User.findById = () => ({ select: async () => ({ _id: "u1", name: "Priya", email: "priya@example.test" }) });
Feedback.create = async (doc) => (stored.push(doc), doc);

const send = async (body, userId = "u1") => {
  const res = fakeRes();
  await create(fakeReq({ body, user: { id: userId } }), res);
  return res;
};

test("a good note is stored against the signed-in student, not an id from the request", async () => {
  stored.length = 0;
  const res = await send({ kind: "problem", message: "The jobs page is blank", page: "jobs", user: "someone-else" }, "u1");
  assert.equal(res.statusCode, 201);
  assert.equal(stored[0].user, "u1");
  assert.equal(stored[0].page, "jobs");
});

test("an unknown kind, a missing message and a too-short message are refused", async () => {
  assert.equal((await send({ kind: "spam", message: "hello there" })).statusCode, 400);
  assert.equal((await send({ kind: "idea", message: "" })).statusCode, 400);
  assert.equal((await send({ kind: "idea", message: "hi" })).statusCode, 400);
});

test("a message over 2,000 characters is refused", async () => {
  assert.equal((await send({ kind: "idea", message: "a".repeat(2001) })).statusCode, 400);
});

test("the rating is kept only when it is a whole number from 1 to 5", async () => {
  const ratingFor = async (r) => {
    stored.length = 0;
    await send({ kind: "praise", message: "Really useful", rating: r });
    return stored[0].rating;
  };
  assert.equal(await ratingFor(4), 4);
  assert.equal(await ratingFor(0), null);
  assert.equal(await ratingFor(9), null);
  assert.equal(await ratingFor(3.5), null);
  assert.equal(await ratingFor("5"), 5);
  assert.equal(await ratingFor("abc"), null);
});

test("permission to reply is only given by an explicit true", async () => {
  const contactFor = async (v) => {
    stored.length = 0;
    await send({ kind: "idea", message: "Add more employers", canContact: v });
    return stored[0].canContact;
  };
  assert.equal(await contactFor(true), true);
  assert.equal(await contactFor("true"), false);
  assert.equal(await contactFor(1), false);
  assert.equal(await contactFor(undefined), false);
});

test("the owner is emailed, and the student's email appears only if they allowed a reply", async () => {
  process.env.FEEDBACK_NOTIFY_EMAIL = "owner@example.test";
  sent.length = 0;
  await send({ kind: "idea", message: "Add banks please", canContact: false });
  await send({ kind: "idea", message: "Add banks please", canContact: true });
  await new Promise((r) => setImmediate(r));
  assert.equal(sent.length, 2);
  assert.ok(!sent[0].text.includes("priya@example.test"), "email must stay private without permission");
  assert.ok(sent[1].text.includes("priya@example.test"));
  delete process.env.FEEDBACK_NOTIFY_EMAIL;
});

test("an unknown account is told to log in again", async () => {
  const original = User.findById;
  User.findById = () => ({ select: async () => null });
  assert.equal((await send({ kind: "idea", message: "Hello there" })).statusCode, 401);
  User.findById = original;
});
