const mongoose = require("mongoose");

// One role the Sponsorship Scout found for one student, with the evidence it was picked on.
const scoutPickSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true }, // the job's URL, or title|company, from the AI service
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: "" },
    url: { type: String, default: "" },
    salary: { type: String, default: "" },
    source: { type: String, default: "" },
    direct: { type: Boolean, default: false },
    seniority: { type: String, default: "" },
    created: { type: String, default: "" },
    skillsHit: { type: [String], default: [] },
    reason: { type: String, default: "" },
    // What the posting says about sponsorship: { status, quote }
    wording: { type: mongoose.Schema.Types.Mixed, default: { status: "unclear", quote: "" } },
    wordingBasis: { type: String, default: "" }, // "full" or "preview"
    salaryCheck: { type: mongoose.Schema.Types.Mixed, default: null },
    state: { type: String, enum: ["new", "saved", "dismissed"], default: "new" },
    emailedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

scoutPickSchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("ScoutPick", scoutPickSchema);
