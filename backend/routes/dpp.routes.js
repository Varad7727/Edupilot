const express = require("express");
const router = express.Router();

const {
    createDPP,
    getTeacherDPPs,
    getDPPById,
    addQuestionToDPP,
} = require("../controller/dpp.controller");

const { authTeacherMiddleware } = require("../middleware/auth.middleware");

// All routes require teacher authentication.
router.post("/", authTeacherMiddleware, createDPP);
router.get("/", authTeacherMiddleware, getTeacherDPPs);
router.get("/:dppId", authTeacherMiddleware, getDPPById);
router.post("/:dppId/questions", authTeacherMiddleware, addQuestionToDPP);

module.exports = router;