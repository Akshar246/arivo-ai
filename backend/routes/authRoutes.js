const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");

// Import all the controller functions (including the new OAuth ones)
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
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

// Each request can trigger an email, so keep these tight
const forgotLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many reset requests. Please try again in an hour.",
  key: (req) => `${req.ip}|${String(req.body?.email || "").toLowerCase()}`,
});
const resetLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts. Please wait a few minutes and try again.",
});
const resendLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "That's enough emails for now. Check your inbox and spam, or try again in an hour.",
});

router.post("/forgot-password", forgotLimit, forgotPassword);
router.post("/reset-password", resetLimit, resetPassword);
router.post("/verify-email", resetLimit, verifyEmail);
router.post("/resend-verification", protect, resendLimit, resendVerification);

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