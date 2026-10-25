
const CourseEnrollment = require("../model/enrollment.model.js");
const Course = require("../model/course.model.js");

// Check whether a student has an active enrollment
// in an active course.
const hasActiveCourseEnrollment = async (studentId, courseId) => {
    if (!studentId || !courseId) {
        return false;
    }

    const [course, enrollment] = await Promise.all([
        Course.findOne({
            _id: courseId,
            isActive: true,
        }).select("_id").lean(),

        CourseEnrollment.findOne({
            student: studentId,
            course: courseId,
            status: "active",
        }).select("_id").lean(),
    ]);

    return Boolean(course && enrollment);
};

module.exports = {
    hasActiveCourseEnrollment,
};
