const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const c = require("../controllers/scoutController");

// Public: one-click unsubscribe from an email, and the scheduler (guarded by a secret header)
router.get("/unsubscribe", c.unsubscribe);
router.post("/run-all", rateLimit({ windowMs: 60 * 60 * 1000, max: 12, message: "Too many runs." }), c.run);

router.use(protect);
router.get("/", c.get);
router.put("/settings", c.updateSettings);
// A scan runs the language model and several job lookups, so cap it per student
router.post(
  "/run",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 4,
    message: "The Scout has already searched a few times this hour. Try again later.",
    key: (req) => String(req.user.id),
  }),
  c.runMe,
);
router.patch("/picks/:id", c.setState);

module.exports = router;
