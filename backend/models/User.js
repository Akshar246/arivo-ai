const mongoose = require("mongoose");

// This defines the shape of a User document in MongoDB
// Think of it like a form — every user must fill these fields
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // cannot create a user without a name
      trim: true, // removes accidental spaces before and after
    },

    email: {
      type: String,
      required: true,
      unique: true, // no two users can have the same email
      lowercase: true, // always stored as lowercase
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6, // minimum 6 characters for security
    },

    nationality: {
      type: String,
      default: "", // optional field — empty string if not provided
    },

    university: {
      type: String,
      default: "",
    },

    course: {
      type: String,
      default: "",
    },

    targetRole: {
      type: String,
      default: "", // e.g. "ML Engineer", "Data Scientist"
    },

    visaType: {
      type: String,
      default: "Student Visa",
    },

    // Shared career data read and written by Profile, ATS and Jobs
    careerProfile: {
      skills: [
        {
          _id: false,
          name: { type: String, required: true, trim: true },
          source: { type: String, enum: ["cv", "manual", "learned"], default: "manual" },
          evidence: { type: String, default: "" }, // CV line that mentions the skill
        },
      ],
      cvText: { type: String, default: "" },
      cvUploadedAt: { type: Date, default: null },
      gap: { type: mongoose.Schema.Types.Mixed, default: null },
      gapRole: { type: String, default: "" },
      gapAt: { type: Date, default: null },
      plan: [
        {
          _id: false,
          skill: String,
          done: { type: Boolean, default: false },
          resource: { type: String, default: "" },
          url: { type: String, default: "" },
          time: { type: String, default: "" },
        },
      ],
      ats: {
        score: { type: Number, default: null },
        missingKeywords: { type: [String], default: [] },
        at: { type: Date, default: null },
      },
    },
  },
  {
    // timestamps automatically adds createdAt and updatedAt
    // to every document — very useful for sorting and debugging
    timestamps: true,
  }
);

// Export the model so other files can use it
// "User" becomes the collection name "users" in MongoDB
module.exports = mongoose.model("User", userSchema);