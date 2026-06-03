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