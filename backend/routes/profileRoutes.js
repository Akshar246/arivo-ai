const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/profileController");

router.use(protect);
router.get("/", c.getProfile);
router.put("/", c.updateProfile);
router.put("/skills", c.setSkills);
router.put("/gap", c.saveGap);
router.patch("/plan", c.setPlanItem);
router.post("/ats", c.saveAts);

module.exports = router;
