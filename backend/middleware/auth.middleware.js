const studentModel = require("../model/student.model");
const teacherModel = require("../model/teacher.model");
const jwt = require("jsonwebtoken");

const authStudentMiddleware = async (req, res, next) => {
    const authHeaderToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    const cookieToken = req.cookies?.token;
    const candidates = [authHeaderToken, cookieToken].filter(Boolean);

    if (candidates.length === 0) {
        return res.status(401).json({
            message: "No Student Found!!",
            status: "failed"
        });
    }

    let student = null;
    let hasRoleMismatch = false;

    for (const token of candidates) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === "student") {
                const found = await studentModel.findById(decoded.id);
                if (found) {
                    student = found;
                    break;
                }
            } else {
                hasRoleMismatch = true;
            }
        } catch (error) {
            // Try next candidate
        }
    }

    if (student) {
        req.student = student;
        return next();
    }

    if (hasRoleMismatch) {
        return res.status(403).json({
            message: "Student access only.",
            status: "failed"
        });
    }

    return res.status(401).json({
        message: "Invalid Token!!",
        status: "failed"
    });
};

const authTeacherMiddleware = async (req, res, next) => {
    const authHeaderToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    const cookieToken = req.cookies?.token;
    const candidates = [authHeaderToken, cookieToken].filter(Boolean);

    if (candidates.length === 0) {
        return res.status(401).json({
            message: "No Teacher Found!!",
            status: "failed"
        });
    }

    let teacher = null;
    let hasRoleMismatch = false;

    for (const token of candidates) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === "teacher") {
                const found = await teacherModel.findById(decoded.id);
                if (found) {
                    teacher = found;
                    break;
                }
            } else {
                hasRoleMismatch = true;
            }
        } catch (error) {
            // Try next candidate
        }
    }

    if (teacher) {
        req.teacher = teacher;
        return next();
    }

    if (hasRoleMismatch) {
        return res.status(403).json({
            message: "Teacher access only.",
            status: "failed"
        });
    }

    return res.status(401).json({
        message: "Invalid Token!!",
        status: "failed"
    });
};

module.exports = { authStudentMiddleware, authTeacherMiddleware };