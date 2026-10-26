const studentModel = require("../model/student.model.js");
const CourseEnrollment = require("../model/enrollment.model.js");
const Subject = require("../model/subject.model.js");
const Chapter = require("../model/chapter.model.js");
const Lesson = require("../model/lesson.model.js");
// GET /students/dashboard
const getStudentDashboard = async (req, res) => {
    try {
        // Get the authenticated student's safe profile
        const student = await studentModel.findById(req.student._id)
            .select("firstName lastName email createdAt")
            .lean()

        if (!student) {
            return res.status(404).json({
                status: "failed",
                message: "Student not found."
            });
        }

        // Find this student's active course enrollments.
        const enrollments = await CourseEnrollment.find({
            student: student._id,
            status: "active"
        })

            // The course field contains only a MongoDB reference, not the course's full details.
            // With.populate(), Mongoose fetches the referenced course and replaces that reference in the returned result with the course //document.

            .populate({
                path: "course",
                select: "name code description classLevel isActive"
            })
            .sort({ enrolledAt: -1 })
            .lean()

        // Exclude courses that are no longer active.
        const enrolledCourses = enrollments
            .filter(item => item.course && item.course.isActive)
            .map(item => ({
                _id: item.course._id,
                name: item.course.name,
                code: item.course.code,
                description: item.course.description,
                classLevel: item.course.classLevel,
                enrolledAt: item.enrolledAt
            }))

        const courseIds = enrolledCourses.map(course => course._id);

        // Get active subjects belonging to enrolled courses.
        const subjects = await Subject.find({
            courseId: { $in: courseIds },
            isActive: true
        })
            .select("name code description displayOrder courseId")
            .sort({ displayOrder: 1 })
            .lean();

        // Get published, non-archived chapters for those subjects.
        const subjectIds = subjects.map(subject => subject._id);

        const chapters = await Chapter.find({
            subjectId: { $in: subjectIds },
            status: "published",
            isArchived: false
        })
            .select("title description subjectId order")
            .sort({ order: 1 })
            .lean();

        // Get published, non-archived lessons for those chapters.
        const chapterIds = chapters.map(chapter => chapter._id);

        const lessons = await Lesson.find({
            chapterId: { $in: chapterIds },
            status: "published",
            isArchived: false
        })
            .select("title chapterId order estimatedDuration difficulty")
            .sort({ order: 1 })
            .lean();

        // Assemble the course -> subject -> chapter -> lesson hierarchy.
        const courseOverview = enrolledCourses.map(course => {
            const courseSubjects = subjects
                .filter(subject =>
                    subject.courseId.toString() === course._id.toString()
                )
                .map(subject => {
                    const subjectChapters = chapters
                        .filter(chapter =>
                            chapter.subjectId.toString() === subject._id.toString()
                        )
                        .map(chapter => ({
                            ...chapter,
                            lessons: lessons.filter(
                                lesson =>
                                    lesson.chapterId.toString() ===
                                    chapter._id.toString()
                            )
                        }));

                    return {
                        ...subject,
                        chapters: subjectChapters
                    };
                });

            return {
                ...course,
                subjects: courseSubjects
            };
        });
       return res.status(200).json({
    status: "success",
    message: "Student dashboard retrieved successfully.",
    data: {
        profile: {
            id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            fullName: `${student.firstName} ${student.lastName}`,
            email: student.email,
            joinedAt: student.createdAt
        },
        summary: {
            enrolledCourses: enrolledCourses.length,
            subjects: subjects.length,
            chapters: chapters.length,
            lessons: lessons.length
        },
        enrolledCourses,
        courseOverview
    }
});
    } catch (error) {
        console.error("Get student dashboard error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to retrieve student dashboard."
        });
    }
}

module.exports = {
    getStudentDashboard
}