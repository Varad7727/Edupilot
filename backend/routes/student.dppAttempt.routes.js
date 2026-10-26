
const express = require("express");
const router = express.Router();

const { authStudentMiddleware } =
  require("../middleware/auth.middleware.js");

const controller =
  require("../controller/student.dppAttempt.controller.js");

router.post(
  "/:dppId/attempts",
  authStudentMiddleware,
  controller.startAttempt
);

router.patch(
  "/attempts/:attemptId/answers",
  authStudentMiddleware,
  controller.saveAnswer
);

router.post(
  "/attempts/:attemptId/submit",
  authStudentMiddleware,
  controller.submitAttempt
);

router.get(
  "/attempts/:attemptId",
  authStudentMiddleware,
  controller.getAttemptResult
);

router.get(
  "/attempts",
  authStudentMiddleware,
  controller.getMyAttempts
);

module.exports = router;
