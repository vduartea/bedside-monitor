const express = require("express");
const router = express.Router();

const { applyScale, getLatestScaleApplication } = require("../controllers/scaleApplications-controller");

// Si quieres proteger con JWT (opcional en tu backend), descomenta:
// const authMiddleware = require("../middlewares/auth.middleware");
// router.post("/", authMiddleware, applyScale);

router.post("/", applyScale);
router.get("/latest", getLatestScaleApplication);


module.exports = router;
