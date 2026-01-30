const express = require("express");
const router = express.Router();
const bedsController = require("../controllers/beds_controller");

router.post("/", bedsController.createOrUpdateBed);
router.get("/", bedsController.getBeds);

module.exports = router;
