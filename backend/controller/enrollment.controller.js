const mongoose = require("mongoose");
const CourseEnrollment = require("../model/enrollment.model.js");
const Course = require("../model/course.model.js");

// POST /students/enrollments
const enrollStudentInCourse = async (req, res) => {
    try {
        const studentId = req.student?._id;
        const { courseId } = req.body || {};

        if (!studentId) {
            return res.status(401).json({
                status: "failed",
                message: "Student authentication is required."
            });
        }

        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({
                status: "failed",
                message: "A valid course ID is required."
            });
        }

        const course = await Course.findOne({
            _id: courseId,
            isActive: true
        }).select("_id name code classLevel").lean();

        if (!course) {
            return res.status(404).json({
                status: "failed",
                message: "Active course not found."
            });
        }

        const existingEnrollment = await CourseEnrollment.findOne({
            student: studentId,
            course: courseId
        }).lean();

        if (existingEnrollment) {
            return res.status(409).json({
                status: "failed",
                message: "You are already enrolled in this course."
            });
        }

        const enrollment = await CourseEnrollment.create({
            student: studentId,
            course: courseId
        });

        return res.status(201).json({
            status: "success",
            message: "Course enrollment successful.",
            data: {
                _id: enrollment._id,
                course
            }
        });
    } catch (error) {
        // Handles concurrent requests hitting the unique index.
        if (error.code === 11000) {
            return res.status(409).json({
                status: "failed",
                message: "You are already enrolled in this course."
            });
        }

        console.error("Enroll student error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to enroll in the course."
        });
    }
};

// GET /students/enrollments
const getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.student?._id;

        if (!studentId) {
            return res.status(401).json({
                status: "failed",
                message: "Student authentication is required."
            });
        }

        const enrollments = await CourseEnrollment.find({
            student: studentId,
            status: "active"
        })
            .populate({
                path: "course",
                match: { isActive: true },
                select: "name code description classLevel"
            })
            .sort({ enrolledAt: -1 })
            .lean();

        const data = enrollments
            .filter(item => item.course)
            .map(item => ({
                enrollmentId: item._id,
                enrolledAt: item.enrolledAt,
                course: item.course
            }));

        return res.status(200).json({
            status: "success",
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Get student enrollments error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to retrieve enrollments."
        });
    }
};

module.exports = {
    enrollStudentInCourse,
    getMyEnrollments
};