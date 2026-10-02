const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobKey: { type: String, required: true }, // lowercase company|title, dedupes per user
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    url: { type: String, default: "" },
    sponsorVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["saved", "applied", "interview", "offer", "rejected"],
      default: "saved",
    },
    notes: { type: String, default: "" },
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1, jobKey: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
