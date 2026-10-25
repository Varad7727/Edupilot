
const express = require("express");
const router = express.Router();

const studentController = require("../controller/student.controller.js");
const {
    authStudentMiddleware
} = require("../middleware/auth.middleware.js");
const enrollmentController = require("../controller/enrollment.controller.js");
router.get(
    "/dashboard",
    authStudentMiddleware,
    studentController.getStudentDashboard
);
router.post(
    "/enrollments",
    authStudentMiddleware,
    enrollmentController.enrollStudentInCourse
);

router.get(
    "/enrollments",
    authStudentMiddleware,
    enrollmentController.getMyEnrollments
);

module.exports = router;
