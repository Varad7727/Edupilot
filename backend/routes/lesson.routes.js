
const express = require("express");
const router = express.Router();

const lessonController = require(
    "../controller/lesson.controller.js"
);

const {
    authTeacherMiddleware
} = require("../middleware/auth.middleware.js");

router.use(authTeacherMiddleware);

// Chapter-scoped listing
router.get(
    "/chapter/:chapterId",
    lessonController.getLessonsByChapter
);


// General lesson operations
router.post(
    "/",
    lessonController.createLesson
);

router.get(
    "/",
    lessonController.getMyLessons
);

router.get(
    "/:lessonId",
    lessonController.getLessonById
);

router.patch(
    "/:lessonId",
    lessonController.updateLesson
);

router.patch(
    "/:lessonId/publish",
    lessonController.publishLesson
);

router.patch(
    "/:lessonId/unpublish",
    lessonController.unpublishLesson
);

router.delete(
    "/:lessonId",
    lessonController.archiveLesson
);

module.exports = router;
