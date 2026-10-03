const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/applicationController");

router.use(protect);
router.get("/", c.list);
router.post("/", c.create);
router.post("/unsave", c.unsave);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
