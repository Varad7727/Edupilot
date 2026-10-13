const mongoose = require("mongoose");
const courseModel = require("../model/course.model.js");

// GET /api/courses
const getAllCourses = async (req, res) => {
    try {
        // Find all active courses
        const courses = await courseModel.find({ isActive: true })
            .select("name code description classLevel")
            .sort({ classLevel: 1 })
            .lean();

        return res.status(200).json({
            message: "Courses retrieved successfully.",
            status: "success",
            data: courses
        });
    } catch (error) {
        console.error("Get all courses error:", error.message);

        return res.status(500).json({
            message: "Error retrieving courses.",
            status: "failed"
        });
    }
};

// GET /api/courses/:courseId
const getCoursesById = async (req, res) => {
    try {
        // Get course ID from URL parameters
        const { courseId } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid course ID."
            });
        }

        // Find the active course
        const course = await courseModel.findOne({
            _id: courseId,
            isActive: true
        })
            .select("name code description classLevel")
            .lean();

        if (!course) {
            return res.status(404).json({
                status: "failed",
                message: "Course not found."
            });
        }

        return res.status(200).json({
            status: "success",
            data: course
        });
    } catch (error) {
        console.error("Get course by ID error:", error.message);

        return res.status(500).json({
            status: "failed",
            message: "Error retrieving course."
        });
    }
};

module.exports = {
    getAllCourses,
    getCoursesById
};



//1.select() — Choose which fields to retrieve
//2. .sort() — Arrange the results
//1 means ascending order (smallest to largest).
//-1 means descending order (largest to smallest).
//3. .lean() — Return plain JavaScript objects