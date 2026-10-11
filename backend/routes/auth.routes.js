const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller.js');

//student apis for register, login and logout
router.post("/student/register", authController.resgisterStudent);
router.post("/student/login", authController.loginStudent);
router.post("/student/logout", authController.logoutStudent);

module.exports = router;