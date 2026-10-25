const mongoose = require("mongoose");
const chapterModel = require("../model/chapter.model.js");
const subjectModel = require("../model/subject.model.js");

//create chapter


const createChapter = async (req, res) => {
    try {
        // Retrieve required fields
        const { title, description, subjectId, order } = req.body;

        // Check required fields
        if (!title || !subjectId || order === undefined) {
            return res.status(400).json({
                status: "failed",
                message: "Title, subjectId, and order are required."
            });
        }

        // Validate title
        if (
            typeof title !== "string" ||
            title.trim().length < 2 ||
            title.trim().length > 150
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Title must contain between 2 and 150 characters."
            });
        }

        // Validate subject ID
        if (!mongoose.isValidObjectId(subjectId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid subject ID."
            });
        }

        // Validate order
        if (!Number.isInteger(order) || order < 1) {
            return res.status(400).json({
                status: "failed",
                message: "Order must be a positive integer."
            });
        }

        // Validate description
        if (
            description !== undefined &&
            (
                typeof description !== "string" ||
                description.length > 2000
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Description must be a string of at most 2000 characters."
            });
        }

        // Check that the subject exists and is active
        const subject = await subjectModel.findOne({
            _id: subjectId,
            isActive: true
        });

        if (!subject) {
            return res.status(404).json({
                status: "failed",
                message: "Active subject not found."
            });
        }

        // Create chapter
        const chapter = await chapterModel.create({
            title: title.trim(),
            description: description?.trim() || "",
            subjectId: subject._id,
            createdBy: req.teacher._id,
            order
        });

        // Send success response
        return res.status(201).json({
            status: "success",
            message: "Chapter created successfully.",
            data: chapter
        });

    } catch (error) {
        console.error("Create chapter error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to create chapter."
        });
    }
};


//update chapter
const updateChapter = async (req, res) => {
    try {
        const { chapterId } = req.params
        const { title, description, order, status } = req.body
        if (!mongoose.isValidObjectId(chapterId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid chapter ID."
            });
        }

        // Reject fields that this endpoint does not allow
        const allowedFields = ["title", "description", "order", "status"]
        const recievedFields = Object.keys(req.body)

        // req.body → gives you the actual data.
        // Object.keys(req.body) → helps you inspect which fields the client sent.
        //like title,description,order

        if (recievedFields.length === 0 ||
            recievedFields.some(field => !allowedFields.includes(field))) {

            return res.status(400).json({
                status: "failed",
                message: "Provide valid fields: title, description, order, or status."
            });
        }

        //logic to update the chapter

        const updates = {}

        //title
        if (title !== undefined) {
            if (
                typeof title !== 'string' ||
                title.trim().length < 2 ||
                title.trim().length > 150
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Title must contain between 2 and 150 characters."
                });
            }
            // Store the title in the updates object after removing extra whitespace from the beginning and end.
            updates.title = title.trim();
        }


        // Description validation
        if (description !== undefined) {
            if (
                typeof description !== "string" ||
                description.length > 2000
            ) {
                return res.status(400).json({
                    status: "failed",
                    message:
                        "Description must be a string of at most 2000 characters."
                });
            }

            updates.description = description.trim();
        }

        // Order validation
        if (order !== undefined) {
            if (!Number.isInteger(order) || order < 1) {
                return res.status(400).json({
                    status: "failed",
                    message: "Order must be a positive integer."
                });
            }

            updates.order = order;
        }


        //status
        if (status !== undefined) {
            if (!["draft", "published"].includes(status)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Status must be draft or published."
                });
            }

            updates.status = status;
        }

        // Ownership check: only the creator can update this chapter
        const chapter = await chapterModel.findOneAndUpdate(
            {
                _id: chapterId,
                createdBy: req.teacher._id,
                isArchived: false
            },
            { $set: updates },
            {
                returnDocument: "after",
                runValidators: true
            }

        )

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "Chapter not found or you do not have permission to update it."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Chapter updated successfully.",
            data: chapter
        });

    } catch (error) {
        console.error("Update chapter error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to update chapter."
        });

    }
}

//archive
const archiveChapter = async (req, res) => {
    try {

        const { chapterId } = req.params

        if (!mongoose.isValidObjectId(chapterId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid chapter ID."
            });
        }

        const chapter = await chapterModel.findOneAndUpdate(
            {
                _id: chapterId,
                createdBy: req.teacher._id,
                isArchived: false
            },
            {
                $set: { isArchived: true },
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "Chapter not found or already archived."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Chapter archived successfully.",
            data: chapter
        });
    } catch (error) {
        console.error("Archive chapter error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to archive chapter."
        });

    }
}

//getMyChapters
const getMyChapters = async (req, res) => {
    try {
        const chapters = await chapterModel
            .find({
                createdBy: req.teacher._id,
                isArchived: false
            })
            .populate("subjectId", "name code courseId")
            .sort({ order: 1 })
            .lean();

        return res.status(200).json({
            status: "success",
            count: chapters.length,
            data: chapters
        });
    } catch (error) {
        console.error("Get chapters error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to retrieve chapters."
        });
    }
};

//byid
const getChapterById = async (req, res) => {
    try {
        const { chapterId } = req.params;

        if (!mongoose.isValidObjectId(chapterId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid chapter ID."
            });
        }

        const chapter = await chapterModel
            .findOne({
                _id: chapterId,
                createdBy: req.teacher._id,
                isArchived: false
            })
            .populate("subjectId", "name code courseId")
            .lean();

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "Chapter not found."
            });
        }

        return res.status(200).json({
            status: "success",
            data: chapter
        });
    } catch (error) {
        console.error("Get chapter error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to retrieve chapter."
        });
    }
};

//PublishedChaptersBySubject 
const getPublishedChaptersBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params
        if (!mongoose.isValidObjectId(subjectId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid subject ID."
            });
        }

        // Only allow browsing subjects that are active.
        const subject = await subjectModel.findOne({
            _id: subjectId,
            isActive: true
        }).select("_id")

        if (!subject) {
            return res.status(404).json({
                status: "failed",
                message: "Subject not found."
            });
        }

        // Students should see published, non-archived chapters only.
        const chapters = await chapterModel.find({
    subjectId: subject._id,
    status: "published",
    isArchived: false
})
    .select("title description subjectId order")
    .sort({ order: 1 })
    .lean();

        return res.status(200).json({
            status: "success",
            count: chapters.length,
            data: chapters
        });

    } catch (error) {
        console.error("Get published chapters error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Unable to retrieve chapters."
        });
    }
}


module.exports = {
    createChapter,
    getMyChapters,
    getChapterById,
    updateChapter,
    archiveChapter,
    getPublishedChaptersBySubject
};






// Function	Purpose
// createChapter	Create a chapter under an existing subject
// getMyChapters	List chapters created by the logged-in teacher
// getChapterById	Retrieve one of the teacher's chapters
// updateChapter	Update title, description, order, or status
// archiveChapter	Archive a chapter instead of permanently deleting it

//isArchived: false
//Allows updates only to chapters that are not archived

// returnDocument: "after" — returns the document after the update. In modern Mongoose versions, { new: true } is another commonly used option for this purpose.

// runValidators: true — runs applicable schema validators on the updated fields, such as minlength, maxlength, and min.