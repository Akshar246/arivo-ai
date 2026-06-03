const express = require("express");

// express.Router() creates a mini application
// capable of performing middleware and routing
// Think of it as a section of your API
const router = express.Router();

// Import the controller functions we just built
const { register, login, getMe } = require("../controllers/authController");

// Import the auth middleware to protect private routes
const { protect } = require("../middleware/auth");

// ─────────────────────────────────────────────
// PUBLIC ROUTES — no token needed
// Anyone can hit these endpoints
// ─────────────────────────────────────────────

// POST /api/auth/register → runs register function
router.post("/register", register);

// POST /api/auth/login → runs login function
router.post("/login", login);

// ─────────────────────────────────────────────
// PRIVATE ROUTES — token required
// protect middleware runs first
// if token valid → getMe runs
// if token invalid → 401 returned immediately
// ─────────────────────────────────────────────

// GET /api/auth/me → runs protect then getMe
router.get("/me", protect, getMe);

module.exports = router;