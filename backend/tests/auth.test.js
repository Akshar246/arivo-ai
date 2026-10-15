const test = require("node:test");
const assert = require("node:assert/strict");
process.env.JWT_SECRET = "test-secret-" + "x".repeat(40);
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { fakeReq, fakeRes } = require("./helpers");

const run = async (token, account) => {
  User.findById = () => ({ select: async () => account });
  const req = fakeReq({ headers: token ? { authorization: `Bearer ${token}` } : {} });
  const res = fakeRes();
  let next = false;
  await protect(req, res, () => (next = true));
  return { next, status: res.statusCode, user: req.user };
};
const sign = (payload, opts = { expiresIn: "1h" }) => jwt.sign(payload, process.env.JWT_SECRET, opts);

test("no token is refused", async () => assert.equal((await run(null, null)).status, 401));

test("a token signed with another secret is refused", async () => {
  const forged = jwt.sign({ id: "u1" }, "another-secret-" + "y".repeat(40));
  assert.equal((await run(forged, {})).status, 401);
});

test("an expired token is refused", async () => {
  const old = jwt.sign({ id: "u1", exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
  assert.equal((await run(old, {})).status, 401);
});

test("an unsigned 'none' token is refused", async () => {
  const none = Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url") + "." + Buffer.from('{"id":"u1"}').toString("base64url") + ".";
  assert.equal((await run(none, {})).status, 401);
});

test("a valid token is accepted and exposes the user id", async () => {
  const out = await run(sign({ id: "u1" }), { passwordChangedAt: null });
  assert.equal(out.next, true);
  assert.equal(out.user.id, "u1");
});

test("a session from before a password reset stops working", async () => {
  const issued = Math.floor(Date.now() / 1000) - 120;
  const token = jwt.sign({ id: "u1", iat: issued }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const out = await run(token, { passwordChangedAt: new Date() });
  assert.equal(out.next, false);
  assert.equal(out.status, 401);
});

test("a session started after the reset keeps working", async () => {
  const out = await run(sign({ id: "u1" }), { passwordChangedAt: new Date(Date.now() - 60_000) });
  assert.equal(out.next, true);
});
