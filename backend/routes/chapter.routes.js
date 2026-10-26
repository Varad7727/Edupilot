const express = require("express");
const router = express.Router();

const chapterController = require("../controller/chapter.controller.js");
const {
    authTeacherMiddleware
} = require("../middleware/auth.middleware.js");
const {
    authStudentMiddleware
} = require("../middleware/auth.middleware.js");

router.post(
    "/",
    authTeacherMiddleware,
    chapterController.createChapter
);

router.get(
    "/",
    authTeacherMiddleware,
    chapterController.getMyChapters
);

router.get(
    "/:chapterId",
    authTeacherMiddleware,
    chapterController.getChapterById
);

router.patch(
    "/:chapterId",
    authTeacherMiddleware,
    chapterController.updateChapter
);

router.delete(
    "/:chapterId",
    authTeacherMiddleware,
    chapterController.archiveChapter
);

router.get(
"/subjects/",
authStudentMiddleware,
chapterController.getPublishedChaptersBySubject
);

module.exports = router;