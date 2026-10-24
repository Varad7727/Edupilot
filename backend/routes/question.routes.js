const express = require("express");
const router = express.Router();

const {
    createQuestion,
    getTeacherQuestions,
    getQuestionById,
    updateQuestion,
    archiveQuestion,
} = require("../controller/question.controller");
const { authTeacherMiddleware } = require("../middleware/auth.middleware");

router.use(authTeacherMiddleware);
router.route("/")
    .post(createQuestion)
    .get(getTeacherQuestions);
router.route("/:questionId")
    .get(getQuestionById)
    .patch(updateQuestion)
    .delete(archiveQuestion);

module.exports = router;
