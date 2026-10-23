// Read the feedback students have sent. Run it on your own machine; it reads the database named in .env.
//   node scripts/feedback.js          latest 30 notes
//   node scripts/feedback.js 100      latest 100 notes
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const limit = Math.min(Number(process.argv[2]) || 30, 500);
  const notes = await Feedback.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  const users = await User.find({ _id: { $in: notes.map((n) => n.user) } }).select("name email").lean();
  const by = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const byKind = notes.reduce((a, n) => ((a[n.kind] = (a[n.kind] || 0) + 1), a), {});
  console.log(`\n${notes.length} notes (${Object.entries(byKind).map(([k, v]) => `${k}: ${v}`).join(", ") || "none yet"})\n`);
  for (const n of notes) {
    const u = by[String(n.user)];
    const who = n.canContact && u ? `${u.name} <${u.email}> (OK to reply)` : "anonymous (no reply permission)";
    console.log(`[${n.createdAt.toISOString().slice(0, 16).replace("T", " ")}] ${n.kind.toUpperCase()}${n.rating ? `  ${n.rating}/5` : ""}  on "${n.page || "?"}"\n  ${who}\n  ${n.message.replace(/\n/g, "\n  ")}\n`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
