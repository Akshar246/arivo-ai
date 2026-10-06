const User = require("../models/User");
const Application = require("../models/Application");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const gone = (res) => res.status(401).json({ message: "Account not found. Log in again." });

const VISA_TYPES = ["Student visa", "Graduate visa", "Skilled Worker visa", "UK citizen / settled", "Other"];
const LOOKING_FOR = ["Graduate job", "Internship", "Placement year", "Part-time"];

const clean = (s, max = 80) => String(s || "").trim().slice(0, max);

const publicProfile = (user) => {
  const cp = user.careerProfile || {};
  return {
    targetRole: user.targetRole || "",
    visaType: user.visaType || "",
    visaEndDate: user.visaEndDate || null,
    lookingFor: user.lookingFor || [],
    onboarded: !!user.onboardedAt,
    skills: cp.skills || [],
    cvUploadedAt: cp.cvUploadedAt || null,
    hasCv: !!cp.cvText,
    gap: cp.gap || null,
    gapRole: cp.gapRole || "",
    gapAt: cp.gapAt || null,
    plan: cp.plan || [],
    ats: cp.ats && cp.ats.score !== null && cp.ats.score !== undefined ? cp.ats : null,
  };
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: "Could not load profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const update = {};
    if (req.body.targetRole !== undefined) update.targetRole = clean(req.body.targetRole, 100);
    if (req.body.visaType !== undefined) {
      const v = clean(req.body.visaType, 60);
      if (v && !VISA_TYPES.includes(v)) return res.status(400).json({ message: "Unknown visa type" });
      update.visaType = v;
    }
    if (req.body.visaEndDate !== undefined) {
      if (!req.body.visaEndDate) update.visaEndDate = null;
      else {
        const d = new Date(req.body.visaEndDate);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid visa end date" });
        update.visaEndDate = d;
      }
    }
    if (req.body.lookingFor !== undefined) {
      const list = Array.isArray(req.body.lookingFor) ? req.body.lookingFor : [];
      update.lookingFor = [...new Set(list.filter((x) => LOOKING_FOR.includes(x)))];
    }
    if (req.body.onboarded === true) update.onboardedAt = new Date();
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!user) return gone(res);
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: "Could not update profile" });
  }
};

// Replace the whole skills list (add/remove done client-side)
const setSkills = async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.skills) ? req.body.skills : [];
    const seen = new Set();
    const skills = [];
    for (const s of incoming) {
      const name = clean(s.name, 60);
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      skills.push({
        name,
        source: ["cv", "manual", "learned"].includes(s.source) ? s.source : "manual",
        evidence: clean(s.evidence, 200),
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    user.careerProfile.skills = skills;
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: "Could not save skills" });
  }
};

// Store a gap analysis and build the learning plan, keeping ticks for skills already planned
const saveGap = async (req, res) => {
  try {
    const gap = req.body.gap;
    if (!gap || typeof gap !== "object") {
      return res.status(400).json({ message: "Missing gap result" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    const cp = user.careerProfile;
    const doneBefore = new Map((cp.plan || []).map((p) => [p.skill.toLowerCase(), p.done]));
    const resources = gap.learning_resources || {};
    const planSkills = [...(gap.missing_required || [])];

    cp.plan = planSkills.map((skill) => {
      const r = resources[skill] || {};
      return {
        skill,
        done: doneBefore.get(skill.toLowerCase()) || false,
        resource: clean(r.resource, 120),
        url: clean(r.url, 300),
        time: clean(r.time, 40),
      };
    });
    cp.gap = gap;
    cp.gapRole = clean(gap.target_role, 100);
    cp.gapAt = new Date();
    user.markModified("careerProfile.gap");
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: "Could not save analysis" });
  }
};

// Tick or untick a learning-plan skill. Ticking adds it to skills as "learned".
const setPlanItem = async (req, res) => {
  try {
    const skill = clean(req.body.skill);
    const done = !!req.body.done;
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    const cp = user.careerProfile;
    const item = (cp.plan || []).find((p) => p.skill.toLowerCase() === skill.toLowerCase());
    if (!item) return res.status(404).json({ message: "Skill not in plan" });
    item.done = done;

    const idx = cp.skills.findIndex((s) => s.name.toLowerCase() === skill.toLowerCase());
    if (done && idx === -1) {
      cp.skills.push({ name: item.skill, source: "learned", evidence: "" });
    } else if (!done && idx !== -1 && cp.skills[idx].source === "learned") {
      cp.skills.splice(idx, 1);
    }
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: "Could not update plan" });
  }
};

// Latest ATS result, saved from the ATS page
const saveAts = async (req, res) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isFinite(score)) return res.status(400).json({ message: "Invalid score" });
    const missing = (Array.isArray(req.body.missingKeywords) ? req.body.missingKeywords : [])
      .map((k) => clean(typeof k === "string" ? k : k?.keyword, 60))
      .filter(Boolean)
      .slice(0, 30);
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    user.careerProfile.ats = { score, missingKeywords: missing, at: new Date() };
    await user.save();
    res.json(publicProfile(user));
  } catch (err) {
    res.status(500).json({ message: "Could not save ATS result" });
  }
};

// Permanently deletes the account and everything stored for it
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    const ok = await bcrypt.compare(String(req.body?.password || ""), user.password);
    if (!ok) return res.status(400).json({ message: "Incorrect password." });
    await Application.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Could not delete account" });
  }
};

// Interview questions drawn from the student's own CV. The stored CV text goes
// from the database to the AI service and is never sent to the browser.
const cvQuestions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return gone(res);
    const cvText = user.careerProfile?.cvText || "";
    if (!cvText) return res.status(400).json({ message: "Upload your CV first, then we can draft questions from it." });

    const { data } = await axios.post(
      `${AI_SERVICE_URL}/interview/cv-questions`,
      {
        cv_text: cvText,
        job_title: clean(req.body?.jobTitle, 120),
        company: clean(req.body?.company, 120),
        description: String(req.body?.description || "").slice(0, 2000),
        count: 4,
      },
      { timeout: 60000 },
    );
    if (data.error) return res.status(502).json({ message: data.error });
    res.json({ questions: data.questions || [] });
  } catch (err) {
    console.error("CV questions error:", err.message);
    res.status(502).json({ message: "Could not draft questions from your CV right now. Try again." });
  }
};

module.exports = { cvQuestions, deleteAccount, getProfile, updateProfile, setSkills, saveGap, setPlanItem, saveAts };
