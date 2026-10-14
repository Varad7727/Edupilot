const express = require("express");
const router = express.Router();

const teacherController = require("../controller/teacher.controller.js");
const { authTeacherMiddleware } = require("../middleware/auth.middleware.js");

router.get("/me", authTeacherMiddleware, teacherController.getMyProfile);
router.patch("/update", authTeacherMiddleware, teacherController.updateMyProfile);

module.exports = router;