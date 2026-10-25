const studentModel = require("../model/student.model");
const teacherModel = require("../model/teacher.model");
const jwt = require("jsonwebtoken");

const authStudentMiddleware = async (req, res, next) => {
    //check token
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "No Student Found!!",
            status: "failed"
        })
    }


    try {
        //verify token
        //verified students should get access to the route
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role !== "student") {
            return res.status(403).json({
                message: "Student access only.",
                status: "failed"
            });
        }
        //find student by id
        const student = await studentModel.findById(decoded.id)
        req.student = student
        next()
    } catch (error) {
        return res.status(401).json({
            message: "Invalid Token!!",
            status: "failed"
        })
    }
}
const authTeacherMiddleware = async (req, res, next) => {
    //check token
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "No Teacher Found!!",
            status: "failed"
        })
    }


    try {
        //verify token
        //verified teachers should get access to the route
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role !== "teacher") {
            return res.status(403).json({
                message: "Teacher access only.",
                status: "failed"
            });
        }
        //find teacher by id
        const teacher = await teacherModel.findById(decoded.id)
        req.teacher = teacher
        next()
    } catch (error) {
        return res.status(401).json({
            message: "Invalid Token!!",
            status: "failed"
        })
    }
}

module.exports = { authStudentMiddleware, authTeacherMiddleware }