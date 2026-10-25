
const express = require("express");
const router = express.Router();

const chapterController = require("../controller/chapter.controller.js");
const {
    authStudentMiddleware
} = require("../middleware/auth.middleware.js");

router.get(
    "/subject/:subjectId",
    authStudentMiddleware,
    chapterController.getPublishedChaptersBySubject
);

module.exports = router;
