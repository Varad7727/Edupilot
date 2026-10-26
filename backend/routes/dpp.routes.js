const express = require("express");
const router = express.Router();

const {
    createDPP,
    getTeacherDPPs,
    getDPPById,
    addQuestionToDPP,
    updateDPP,
    updateQuestionInDPP,
    removeQuestionFromDPP,
    reorderDPPQuestions,
    publishDPP,
    getTeacherStudentAttempts
} = require("../controller/dpp.controller");

const { authTeacherMiddleware } = require("../middleware/auth.middleware");

// All routes require teacher authentication.
router.post("/", authTeacherMiddleware, createDPP);
router.get("/", authTeacherMiddleware, getTeacherDPPs);
router.get("/analytics/attempts", authTeacherMiddleware, getTeacherStudentAttempts);
router.get("/:dppId", authTeacherMiddleware, getDPPById);
router.patch("/:dppId", authTeacherMiddleware, updateDPP);
router.post(
    "/:dppId/questions",
    authTeacherMiddleware,
    addQuestionToDPP
);

router.patch(
    "/:dppId/questions/reorder",
    authTeacherMiddleware,
    reorderDPPQuestions
);
router.patch(
    "/:dppId/questions/:questionId",
    authTeacherMiddleware,
    updateQuestionInDPP
);
router.delete(
    "/:dppId/questions/:questionId",
    authTeacherMiddleware,
    removeQuestionFromDPP
);
router.patch(
    "/:dppId/publish",
    authTeacherMiddleware,
    publishDPP
);

module.exports = router;