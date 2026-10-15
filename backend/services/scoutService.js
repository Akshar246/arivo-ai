const axios = require("axios");
const { aiHeaders } = require("../utils/aiHeaders");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ScoutPick = require("../models/ScoutPick");
const { sendMail } = require("../utils/mailer");

const AI_SERVICE_URL = () => process.env.AI_SERVICE_URL || "http://localhost:8000";
const HOUR = 60 * 60 * 1000;

const profileOf = (user) => ({
  role: user.targetRole || "",
  skills: (user.careerProfile?.skills || []).map((s) => s.name),
  visa_type: user.visaType || "",
  part_time: (user.lookingFor || []).length === 1 && user.lookingFor[0] === "Part-time",
});

// Ask the AI service for new fitting roles, store them, and remember the scan time.
async function scanForUser(user) {
  const p = profileOf(user);
  if (!p.role) {
    const err = new Error("Set a target role first so the Scout knows what to look for.");
    err.status = 400;
    throw err;
  }
  const seen = (await ScoutPick.find({ user: user._id }).select("key").sort({ createdAt: -1 }).limit(600)).map((x) => x.key);

  const { data } = await axios.post(
    `${AI_SERVICE_URL()}/scout/analyse`,
    { ...p, seen, limit: 6 },
    { timeout: 150000, headers: aiHeaders() },
  );
  if (data.error) {
    const err = new Error(data.error);
    err.status = 502;
    throw err;
  }

  const fresh = [];
  for (const pick of data.picks || []) {
    try {
      const doc = await ScoutPick.create({
        user: user._id,
        key: pick.key,
        title: pick.title,
        company: pick.company,
        location: pick.location,
        url: pick.url,
        salary: pick.salary,
        source: pick.source,
        direct: pick.direct,
        seniority: pick.seniority,
        created: pick.created,
        skillsHit: pick.skills_hit,
        reason: pick.reason,
        wording: pick.wording,
        wordingBasis: pick.wording_basis,
        salaryCheck: pick.salary_check,
      });
      fresh.push(doc);
    } catch (e) {
      if (e.code !== 11000) throw e; // already stored: a race with another scan
    }
  }
  user.scout.lastRunAt = new Date();
  await user.save();
  return { fresh, skipped: data.skipped_no_sponsorship || 0, considered: data.considered || 0 };
}

const scanDue = (user) => !user.scout.lastRunAt || Date.now() - user.scout.lastRunAt.getTime() > 20 * HOUR;

const emailDue = (user) => {
  const gap = user.scout.frequency === "daily" ? 20 * HOUR : 6.5 * 24 * HOUR;
  return !user.scout.lastEmailAt || Date.now() - user.scout.lastEmailAt.getTime() > gap;
};

const unsubscribeToken = (user) => jwt.sign({ id: user._id, purpose: "scout-off" }, process.env.JWT_SECRET, { expiresIn: "365d" });

const WORDING_LABEL = {
  sponsorship_offered: "The posting says sponsorship is offered",
  right_to_work_required: "The posting asks for existing permission to work",
  no_sponsorship: "The posting says it can't sponsor",
};

const escapeHtml = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function buildDigest(user, picks, skipped, unsubscribeUrl, appUrl) {
  const lines = [];
  const rows = [];
  for (const p of picks) {
    const bits = [`${p.title} at ${p.company}${p.location ? `, ${p.location}` : ""}`, p.reason];
    const wl = p.wording?.status && WORDING_LABEL[p.wording.status];
    if (wl) bits.push(`${wl}: "${p.wording.quote}"`);
    if (p.wordingBasis === "preview") bits.push("Only a preview of the posting was available, so check the full text for sponsorship wording.");
    if (p.salaryCheck?.label) bits.push(`Salary: ${p.salaryCheck.label}`);
    if (p.url) bits.push(p.url);
    lines.push(bits.join("\n"));
    rows.push(
      `<div style="margin:0 0 18px;padding:0 0 16px;border-bottom:1px solid #e3dccb">
        <div style="font-size:16px;font-weight:600">${escapeHtml(p.title)} <span style="font-weight:400">at ${escapeHtml(p.company)}</span></div>
        <div style="font-size:13px;color:#7a847d;margin:2px 0 6px">${escapeHtml(p.location)}</div>
        <div style="font-size:14px;color:#3d4a43;line-height:1.55">${escapeHtml(p.reason)}</div>
        ${wl ? `<div style="font-size:13px;color:#3d4a43;margin-top:6px"><strong>${escapeHtml(wl)}:</strong> <em>"${escapeHtml(p.wording.quote)}"</em></div>` : ""}
        ${p.wordingBasis === "preview" ? `<div style="font-size:12px;color:#7a847d;margin-top:4px">Only a preview of the posting was available, so check the full text for sponsorship wording.</div>` : ""}
        ${p.salaryCheck?.label ? `<div style="font-size:13px;color:#3d4a43;margin-top:4px">Salary: ${escapeHtml(p.salaryCheck.label)}</div>` : ""}
        ${p.url ? `<div style="margin-top:8px"><a href="${escapeHtml(p.url)}" style="color:#0f3d2e;font-weight:600">Open the posting</a></div>` : ""}
      </div>`,
    );
  }
  const skippedLine = skipped > 0 ? `We also skipped ${skipped} role${skipped === 1 ? "" : "s"} whose posting says the employer can't sponsor.` : "";
  const text = `Hi ${user.name},\n\nYour Sponsorship Scout found ${picks.length} new role${picks.length === 1 ? "" : "s"} that fit you:\n\n${lines.join("\n\n")}\n\n${skippedLine}\n\nA posting isn't a promise: confirm sponsorship and salary with the employer. General information, not immigration advice.\n\nSee them all: ${appUrl}\nTurn the Scout off: ${unsubscribeUrl}\n`;
  const html = `<div style="font-family:Georgia,serif;background:#f5f1e8;padding:28px">
    <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #e3dccb;border-radius:12px;padding:28px;color:#15231c">
      <p style="font-size:22px;margin:0 0 16px">Arivo AI</p>
      <h1 style="font-size:19px;font-weight:400;margin:0 0 18px">${picks.length} new role${picks.length === 1 ? "" : "s"} that fit you</h1>
      <div style="font-family:Arial,sans-serif">${rows.join("")}
        ${skippedLine ? `<p style="font-size:13px;color:#3d4a43">${escapeHtml(skippedLine)}</p>` : ""}
        <p style="font-size:12px;line-height:1.55;color:#7a847d">A posting isn't a promise: confirm sponsorship and salary with the employer. General information, not immigration advice.</p>
        <p style="font-size:12px;color:#7a847d"><a href="${escapeHtml(appUrl)}" style="color:#0f3d2e">See them all in Arivo</a> &middot; <a href="${escapeHtml(unsubscribeUrl)}" style="color:#7a847d">Turn the Scout off</a></p>
      </div></div></div>`;
  return { text, html };
}

// Email the picks the student hasn't been told about yet. Only to confirmed addresses, so a
// mistyped email never receives mail from us.
async function sendDigest(user, { baseUrl, appUrl, skipped = 0 }) {
  if (!user.emailVerifiedAt) return { sent: false, reason: "email not confirmed" };
  const picks = await ScoutPick.find({ user: user._id, state: "new", emailedAt: null }).sort({ createdAt: -1 }).limit(5);
  if (!picks.length) return { sent: false, reason: "nothing new" };
  const unsub = `${baseUrl}/api/scout/unsubscribe?token=${unsubscribeToken(user)}`;
  const { text, html } = buildDigest(user, picks, skipped, unsub, appUrl);
  const r = await sendMail({
    to: user.email,
    subject: `${picks.length} new sponsor-register role${picks.length === 1 ? "" : "s"} for you`,
    text,
    html,
  });
  if (r.sent) {
    await ScoutPick.updateMany({ _id: { $in: picks.map((p) => p._id) } }, { $set: { emailedAt: new Date() } });
    user.scout.lastEmailAt = new Date();
    await user.save();
  }
  return { sent: !!r.sent, count: picks.length };
}

let running = false;

// The daily run, called by a scheduler. One student failing never stops the rest.
async function runAll({ baseUrl, appUrl }) {
  if (running) return { skipped: "already running" };
  running = true;
  const stats = { users: 0, scanned: 0, emailed: 0, failed: 0 };
  try {
    const users = await User.find({ "scout.enabled": true }).limit(500);
    for (const user of users) {
      stats.users += 1;
      try {
        let skipped = 0;
        if (scanDue(user)) {
          const r = await scanForUser(user);
          skipped = r.skipped;
          stats.scanned += 1;
        }
        if (emailDue(user)) {
          const out = await sendDigest(user, { baseUrl, appUrl, skipped });
          if (out.sent) stats.emailed += 1;
        }
      } catch (e) {
        stats.failed += 1;
        console.error(`Scout failed for ${user._id}:`, e.message);
      }
    }
  } finally {
    running = false;
  }
  console.log("Scout run finished:", JSON.stringify(stats));
  return stats;
}

module.exports = { scanForUser, sendDigest, runAll, unsubscribeToken, buildDigest, scanDue, emailDue };
