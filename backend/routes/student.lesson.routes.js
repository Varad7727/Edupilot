const express = require("express");
const router = express.Router();

const lessonController = require(
    "../controller/lesson.controller.js"
);

const {
    authStudentMiddleware
} = require("../middleware/auth.middleware.js");

router.get(
    "/chapter/:chapterId",
    authStudentMiddleware,
    lessonController.getPublishedLessonsByChapter
);

module.exports = router;