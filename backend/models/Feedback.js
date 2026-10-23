const mongoose = require("mongoose");

// A note a student sent from inside the app. Kept deliberately small: what they said, what kind of
// note it is, which screen they were on, and whether they said we may reply.
const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["problem", "confusing", "idea", "praise"], required: true },
    message: { type: String, required: true, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5, default: null },
    page: { type: String, default: "", maxlength: 60 },
    canContact: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
