const test = require("node:test");
const assert = require("node:assert/strict");
const { rateLimit } = require("../middleware/rateLimit");
const { fakeReq, fakeRes } = require("./helpers");

test("allows up to the limit, then answers 429 with a Retry-After header", () => {
  const limit = rateLimit({ windowMs: 60_000, max: 2, message: "slow down" });
  const results = [];
  for (let i = 0; i < 3; i++) {
    const res = fakeRes();
    let passed = false;
    limit(fakeReq(), res, () => (passed = true));
    results.push({ passed, status: res.statusCode, retry: res.headers["Retry-After"], msg: res.body?.message });
  }
  assert.deepEqual(results.map((r) => r.passed), [true, true, false]);
  assert.equal(results[2].status, 429);
  assert.equal(results[2].msg, "slow down");
  assert.ok(Number(results[2].retry) > 0);
});

test("counts each key separately", () => {
  const limit = rateLimit({ windowMs: 60_000, max: 1, message: "x", key: (req) => req.headers.who });
  const pass = (who) => {
    let ok = false;
    limit(fakeReq({ headers: { who } }), fakeRes(), () => (ok = true));
    return ok;
  };
  assert.equal(pass("alice"), true);
  assert.equal(pass("alice"), false);
  assert.equal(pass("bob"), true);
});
