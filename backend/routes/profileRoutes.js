const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const c = require("../controllers/profileController");

router.use(protect);
router.get("/", c.getProfile);
router.put("/", c.updateProfile);
router.delete("/", c.deleteAccount);
// Reads everything held about the student, so keep it to a few times an hour
router.get(
  "/export",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 6, message: "You've downloaded your data a few times already. Try again later.", key: (req) => String(req.user.id) }),
  c.exportData,
);
router.put("/skills", c.setSkills);
router.put("/gap", c.saveGap);
router.patch("/plan", c.setPlanItem);
router.post("/ats", c.saveAts);
// Each call runs the language model on the whole CV, so cap it per student
router.post(
  "/cv-questions",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: "That's plenty of practice for now. Try again in an hour.",
    key: (req) => String(req.user.id),
  }),
  c.cvQuestions,
);

module.exports = router;
