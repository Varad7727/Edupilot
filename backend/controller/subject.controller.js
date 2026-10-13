const mongoose = require("mongoose");
const subjectModel = require("../model/subject.model.js");
const courseModel = require("../model/course.model.js");



// GET /courses//subjects
const getSubjectsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params
        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid course ID."
            })
        }
        const course = await courseModel.findById(courseId)
        if (!course || !course.isActive) {
            return res.status(404).json({
                status: "failed",
                message: "Course not found."
            })
        }

        const subject = await subjectModel.find({
            courseId: course._id,
            isActive: true
        })
            .select("name code description displayOrder courseId")
            .sort({ displayOrder: 1 })
            .lean()
        return res.status(200).json({
            status: "success",
            count: subject.length,
            subject
        });
    } catch (error) {
        console.error("Get subjects by course error:", error.message);
        return res.status(500).json({
            status: "failed",
            message: "Error retrieving subjects."
        });
    }
}

// GET /api/subjects/
const getSubjectById = async (req, res) => {
try {
    const {subjectId} = req.params
    if (!mongoose.isValidObjectId(subjectId)) {
        return res.status(400).json({
            status: "failed",
            message: "Invalid subject ID."
        })
    }
    const subject = await subjectModel.findOne({
  _id: subjectId,
  isActive: true
})
  .select("name code description displayOrder courseId")
  .populate("courseId", "name code classLevel")
  .lean();

if (!subject) {
  return res.status(404).json({
    status: "failed",
    message: "Subject not found."
  });
}

return res.status(200).json({
  status: "success",
  subject
});
}catch (error) {
    console.error("Get subject by ID error:", error.message);
    return res.status(500).json({
        status: "failed",
        message: "Error retrieving subject."
    });
}
}


module.exports = {
getSubjectsByCourse,
getSubjectById
};