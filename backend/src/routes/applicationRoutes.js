const express = require("express");
const {
  applyToJob,
  exitApplication,
  decayApplication,
  getApplicationStatus,
  getAllApplications,
  getAllEvents,
  getApplicationHistory,
} = require("../controllers/applicationController");

const router = express.Router();

router.post("/exit", exitApplication);
router.post("/apply", applyToJob);
router.post("/decay", decayApplication);
router.get("/events", getAllEvents);
router.get("/:id/history", getApplicationHistory);
router.get("/:id/status", getApplicationStatus);
router.get("/", getAllApplications);

module.exports = router;
