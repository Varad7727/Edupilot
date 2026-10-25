const CourseEnrollment = require("../model/enrollment.model.js");
const Subject = require("../model/subject.model.js");
const Chapter = require("../model/chapter.model.js");
const DPP = require("../model/dpp.model.js");

// GET /students/dpps
const getStudentDpps = async (req, res) => {
    try {
        const studentId = req.student?._id
        if (!studentId) {
            return res.status(401).json({
                status: "failed",
                message: "Student authentication is required."
            });
        }
        // 1. Find this student's active enrollments
        // and retain only active courses.
        //make list
        const enrollments = await CourseEnrollment.find({
            student: studentId,
            status: "active"
        })
            .populate({
                path: "course",
                select: "name code classLevel isActive"
            })
            .lean();
        //map the active courses
        //extract active all courses
        const courses = enrollments
            .filter(item => item.course && item.course.isActive)
            .map(item => item.course)

        //make  set of unique ids
        const courseIds = [
            ...new Set(courses.map(course => course._id.toString()))
        ]

        //find active subjects
        const subjects = await Subject.find({
            courseId: { $in: courseIds },
            isActive: true
        })
            .select("name code courseId")
            .lean();
        const subjectIds = subjects.map(subject => subject._id);

        // 3. Only allow published, non-archived chapters.
        const chapters = await Chapter.find({
            subjectId: { $in: subjectIds },
            isArchived: false,
            status: "published"
        })
            .select("title subjectId")
            .lean()

        const chapterIds = chapters.map(chapter => chapter._id)
        const dpps = await DPP.find({
            chapterId: { $in: chapterIds },
            isArchived: false,
            status: "published"
        })
            .select("title description instructions chapterId durationMinutes deadline totalMarks questions createdAt")
            .sort({ deadline: 1, createdAt: -1 })
            .lean()

        // Build lookups to avoid exposing question answers
        // or unnecessary internal question references.
        const subjectById = new Map(
            subjects.map(subject => [
                subject._id.toString(),
                subject
            ])
        );

        const chapterById = new Map(
            chapters.map(chapter => [
                chapter._id.toString(),
                chapter
            ])
        );

        const courseById = new Map(
            courses.map(course => [
                course._id.toString(),
                course
            ])
        );

        const data = dpps.map(dpp => {
            const chapter = chapterById.get(
                dpp.chapterId.toString()
            );

            const subject = chapter
                ? subjectById.get(chapter.subjectId.toString())
                : null;

            const course = subject
                ? courseById.get(subject.courseId.toString())
                : null;

            return {
                _id: dpp._id,
                title: dpp.title,
                description: dpp.description,
                instructions: dpp.instructions,
                durationMinutes: dpp.durationMinutes,
                deadline: dpp.deadline,
                totalMarks: dpp.totalMarks,
                questionCount: dpp.questions.length,
                createdAt: dpp.createdAt,
                chapter: chapter
                    ? {
                        _id: chapter._id,
                        title: chapter.title
                    }
                    : null,
                subject: subject
                    ? {
                        _id: subject._id,
                        name: subject.name,
                        code: subject.code
                    }
                    : null,
                course: course
                    ? {
                        _id: course._id,
                        name: course.name,
                        code: course.code,
                        classLevel: course.classLevel
                    }
                    : null
            };
        });

        return res.status(200).json({
            status: "success",
            message: "Student DPPs retrieved successfully.",
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Get student DPPs error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to retrieve student DPPs."
        });
    }
}
module.exports={getStudentDpps}