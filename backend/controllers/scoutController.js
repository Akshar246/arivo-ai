const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ScoutPick = require("../models/ScoutPick");
const Application = require("../models/Application");
const { scanForUser, runAll } = require("../services/scoutService");

const gone = (res) => res.status(401).json({ message: "Account not found. Log in again." });
const FREQUENCIES = ["weekly", "daily"];

const settingsOf = (user) => ({
  enabled: !!user.scout?.enabled,
  frequency: user.scout?.frequency || "weekly",
  lastRunAt: user.scout?.lastRunAt || null,
  lastEmailAt: user.scout?.lastEmailAt || null,
  emailConfirmed: !!user.emailVerifiedAt,
});

const get = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    const picks = await ScoutPick.find({ user: user._id, state: { $ne: "dismissed" } }).sort({ createdAt: -1 }).limit(30);
    res.json({ settings: settingsOf(user), picks });
  } catch (err) {
    res.status(500).json({ message: "Could not load the Scout" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    if (req.body.enabled !== undefined) user.scout.enabled = !!req.body.enabled;
    if (req.body.frequency !== undefined) {
      if (!FREQUENCIES.includes(req.body.frequency)) return res.status(400).json({ message: "Choose weekly or daily." });
      user.scout.frequency = req.body.frequency;
    }
    await user.save();
    res.json({ settings: settingsOf(user) });
  } catch (err) {
    res.status(500).json({ message: "Could not save your Scout settings" });
  }
};

// "Run now": scan on demand for the signed-in student. No email is sent from here.
const runMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    const { fresh, skipped, considered } = await scanForUser(user);
    res.json({ added: fresh.length, skipped_no_sponsorship: skipped, considered });
  } catch (err) {
    console.error("Scout run error:", err.message);
    res.status(err.status || 502).json({ message: err.status === 400 ? err.message : "The Scout couldn't search just now. Try again in a minute." });
  }
};

// Save, dismiss or restore one pick. Saving also adds the role to the application tracker.
const setState = async (req, res) => {
  try {
    const state = req.body.state;
    if (!["new", "saved", "dismissed"].includes(state)) return res.status(400).json({ message: "Invalid state" });
    const pick = await ScoutPick.findOne({ _id: req.params.id, user: req.user.id });
    if (!pick) return res.status(404).json({ message: "Pick not found" });
    pick.state = state;
    await pick.save();
    if (state === "saved") {
      const jobKey = `${pick.company}|${pick.title}`.toLowerCase();
      await Application.findOneAndUpdate(
        { user: req.user.id, jobKey },
        {
          $setOnInsert: {
            user: req.user.id,
            jobKey,
            title: pick.title,
            company: pick.company,
            location: pick.location,
            url: pick.url,
            sponsorVerified: true,
            status: "saved",
          },
        },
        { upsert: true },
      );
    }
    res.json(pick);
  } catch (err) {
    res.status(500).json({ message: "Could not update this pick" });
  }
};

const page = (heading, body) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arivo AI</title>
  <body style="font-family:Georgia,serif;background:#f5f1e8;color:#15231c;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">
  <div style="max-width:420px;background:#fffdf8;border:1px solid #e3dccb;border-radius:12px;padding:32px">
  <p style="font-size:22px;margin:0 0 20px">Arivo AI</p><h1 style="font-size:20px;font-weight:400;margin:0 0 10px">${heading}</h1>
  <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#3d4a43;margin:0">${body}</p></div></body>`;

// One click from the email, no login needed. The link carries a signed token.
const unsubscribe = async (req, res) => {
  try {
    const t = jwt.verify(String(req.query.token || ""), process.env.JWT_SECRET);
    if (t.purpose !== "scout-off") throw new Error("wrong token");
    await User.updateOne({ _id: t.id }, { $set: { "scout.enabled": false } });
    res.send(page("The Scout is off", "You won't get any more Scout emails. You can turn it back on any time from your dashboard."));
  } catch (e) {
    res.status(400).send(page("That link didn't work", "It may have expired. Log in to Arivo and turn the Scout off from your dashboard."));
  }
};

// Called by the scheduler. Disabled unless CRON_SECRET is set, and compared in constant time.
const run = (req, res) => {
  const secret = process.env.CRON_SECRET || "";
  const given = String(req.get("x-cron-secret") || "");
  const ok = secret.length >= 16 && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return res.status(403).json({ message: "Forbidden" });
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
  const appUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  // Answer straight away: a run can take minutes and the scheduler should not wait for it
  res.status(202).json({ started: true });
  runAll({ baseUrl, appUrl }).catch((e) => console.error("Scout run crashed:", e.message));
};

module.exports = { get, updateSettings, runMe, setState, unsubscribe, run };
