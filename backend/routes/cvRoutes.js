const express = require("express");
const router = express.Router();

// Import the CV controller function
const { uploadCV } = require("../controllers/cvController");

// Import multer upload middleware
const upload = require("../middleware/upload");

// Import auth middleware — only logged in users
// can upload their CV
const { protect } = require("../middleware/auth");

// ─────────────────────────────────────────────
// CV ROUTES
// POST /api/cv/upload
// Flow: protect checks token → upload handles
// the PDF file → uploadCV processes everything
// Three middleware functions chained together
// ─────────────────────────────────────────────
router.post("/upload", protect, upload.single("cv"), uploadCV);

module.exports = router;