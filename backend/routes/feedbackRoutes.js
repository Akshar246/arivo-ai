const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const { create } = require("../controllers/feedbackController");

router.post(
  "/",
  protect,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: "That's a lot of notes in an hour. Please try again later.", key: (req) => String(req.user.id) }),
  create,
);

module.exports = router;
