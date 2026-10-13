const express = require("express");
const router = express.Router();

const courseController = require("../controller/course.controller.js");
const subjectController = require("../controller/subject.controller.js");

router.get("/", courseController.getAllCourses);
router.get("/:courseId", courseController.getCoursesById);
router.get("/:courseId/subjects", subjectController.getSubjectsByCourse);
router.get("/subjects/:subjectId", subjectController.getSubjectById);

module.exports = router;