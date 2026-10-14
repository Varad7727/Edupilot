const mongoose = require("mongoose");
const chapterModel = require("../model/chapter.model.js");
const subjectModel = require("../model/subject.model.js");

//create chapter
const createChapter = async (req, res) => {
    try {
        //retrive whats needed
        const { title, description, subjectId, order } = req.body;

        if (!title || !subjectId || !order) {
            return res.status(400).json({
                status: "failed",
                message: "Title, subjectId, and order are required."
            })
        }

        //check title
        if (typeof title !== 'string' || title.trim().length < 2 ||
            title.trim().length > 150) {
            return res.status(400).json({
                status: "failed",
                message: "Title must contain between 2 and 150 characters."
            })
        }
        //check id
        if (!mongoose.isValidObjectId(subjectId)) {

            return res.status(400).json({
                status: "failed",
                message: "Invalid subject ID."
            });

        }

        //check whether order is positive
        if (!Number.isInteger(order) || order < 1) {
            return res.status(400).json({
                status: "failed",
                message: "Order must be a positive integer."
            });
        }
        //check description
        if (description !== undefined && (
            typeof description !== 'string' || description.length > 2000)) {
            return res.status(400).json({
                status: "failed",
                message: "Description must be a string of at most 2000 characters."
            });

        }

        // Check that the subject exists and is active
        const subject = await subjectModel.findOne({ subject, isActive: true })
        if (!subject) {
            return res.status(404).json({
                status: "failed",
                message: "Active subject not found."
            });

        }

    } catch (error) {

    }
}











// Function	Purpose
// createChapter	Create a chapter under an existing subject
// getMyChapters	List chapters created by the logged-in teacher
// getChapterById	Retrieve one of the teacher's chapters
// updateChapter	Update title, description, order, or status
// archiveChapter	Archive a chapter instead of permanently deleting it