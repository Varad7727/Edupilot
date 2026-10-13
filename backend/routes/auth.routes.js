
const express = require("express");
const router = express.Router();

const authController = require("../controller/auth.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

// Student authentication
router.post("/student/register", authController.resgisterStudent);
router.post("/student/login", authController.loginStudent);
router.post(
  "/student/logout",
  authMiddleware.authStudentMiddleware,
  authController.logoutStudent
);

// Teacher authentication
router.post("/teacher/register", authController.resgisterTeacher);
router.post("/teacher/login", authController.loginTeacher);
router.post(
  "/teacher/logout",
  authMiddleware.authTeacherMiddleware,
  authController.logoutTeacher
);

module.exports = router;
