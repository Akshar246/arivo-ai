const Application = require("../models/Application");

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"];
const clean = (s, max = 200) => String(s || "").trim().slice(0, max);
const keyOf = (company, title) => `${company}|${title}`.toLowerCase();

const list = async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: "Could not load applications" });
  }
};

const create = async (req, res) => {
  try {
    const title = clean(req.body.title);
    const company = clean(req.body.company);
    if (!title || !company) return res.status(400).json({ message: "Title and company required" });
    const status = STATUSES.includes(req.body.status) ? req.body.status : "saved";

    const app = await Application.findOneAndUpdate(
      { user: req.user.id, jobKey: keyOf(company, title) },
      {
        $setOnInsert: {
          user: req.user.id,
          jobKey: keyOf(company, title),
          title,
          company,
          status,
          appliedAt: status === "applied" ? new Date() : null,
        },
        $set: {
          location: clean(req.body.location, 100),
          url: clean(req.body.url, 500),
          sponsorVerified: !!req.body.sponsorVerified,
        },
      },
      { new: true, upsert: true }
    );
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: "Could not save application" });
  }
};

const update = async (req, res) => {
  try {
    const set = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
      set.status = req.body.status;
      if (req.body.status === "applied") set.appliedAt = new Date();
    }
    if (req.body.notes !== undefined) set.notes = clean(req.body.notes, 2000);
    if (req.body.prep !== undefined) {
      const prep = req.body.prep;
      if (prep !== null && (typeof prep !== "object" || JSON.stringify(prep).length > 60000)) {
        return res.status(400).json({ message: "Invalid prep data" });
      }
      set.prep = prep;
    }
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      set,
      { new: true }
    );
    if (!app) return res.status(404).json({ message: "Not found" });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: "Could not update application" });
  }
};

const remove = async (req, res) => {
  try {
    await Application.deleteOne({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Could not delete application" });
  }
};

// Unstarring a job removes it from the tracker only while it is still "saved".
// Anything already applied to or further along is kept.
const unsave = async (req, res) => {
  try {
    const company = clean(req.body.company);
    const title = clean(req.body.title);
    const r = await Application.deleteOne({
      user: req.user.id,
      jobKey: keyOf(company, title),
      status: "saved",
    });
    res.json({ removed: r.deletedCount });
  } catch (err) {
    res.status(500).json({ message: "Could not unsave job" });
  }
};

module.exports = { list, create, update, remove, unsave };
