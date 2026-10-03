const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");

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
const registerLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many sign-up attempts. Please try again later.",
});
// Keyed by IP + email so one noisy address cannot lock out other students
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
  key: (req) => `${req.ip}|${String(req.body?.email || "").toLowerCase()}`,
});

router.post("/register", registerLimit, register);
router.post("/login", loginLimit, login);
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