const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

// Import all the controller functions (including the new OAuth ones)
const {
  register,
  login,
  getMe,
  googleAuth,
  googleCallback,
  linkedinAuth,
  linkedinCallback
} = require("../controllers/authController");

// ─────────────────────────────────────────────
// STANDARD AUTH
// ─────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

// ─────────────────────────────────────────────
// GOOGLE OAUTH
// ─────────────────────────────────────────────
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// ─────────────────────────────────────────────
// LINKEDIN OAUTH
// ─────────────────────────────────────────────
router.get("/linkedin", linkedinAuth);
router.get("/linkedin/callback", linkedinCallback);

module.exports = router;