
const express = require("express");
const router = express.Router();

const studentController = require("../controller/student.controller.js");
const {
    authStudentMiddleware
} = require("../middleware/auth.middleware.js");

router.get(
    "/dashboard",
    authStudentMiddleware,
    studentController.getStudentDashboard
);

module.exports = router;
