
const express = require("express");
const router = express.Router();

const {
    authStudentMiddleware
} = require("../middleware/auth.middleware.js");

const {
    getStudentDpps
} = require("../controller/student.dpp.controller.js");
console.log("authStudentMiddleware:", typeof authStudentMiddleware);
console.log("getStudentDPPs:", typeof getStudentDpps);
router.get(
    "/",
    authStudentMiddleware,
    getStudentDpps
);

module.exports = router;
