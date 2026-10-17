const mongoose = require("mongoose")
const lessonModel = require("../model/lesson.model")
const chapterModel = require("../model/chapter.model")

// Fields allowed in a lesson create/update request.
const editableFields = [
    "title",
    "description",
    "order",
    "estimatedDuration",
    "difficulty",
    "learningObjectives",
    "topics",
    "tags",
    "prerequisites",
    "aiContext"
];

//functions for valid string
const isValidString = (value, min, max) =>
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max


const sendError = (res, error, message) => {
    console.error(message, error);

    if (error.code === 11000) {
        return res.status(409).json({
            status: "failed",
            message: "This lesson order is already used in the chapter."
        });
    }

    if (
        error.name === "ValidationError" ||
        error.name === "CastError"
    ) {
        return res.status(400).json({
            status: "failed",
            message: "Invalid lesson data."
        });
    }

    return res.status(500).json({
        status: "failed",
        message: "Something went wrong while processing the lesson."
    });
};


//check ownership
const getOwnedChapter = async (chapterId, teacherId) => {
    return chapterModel.findOne({
        _id: chapterId,
        createdBy: teacherId,
        isArchived: false
    });
};

// CREATE LESSON
const createLesson = async (req, res) => {
    try {
        const {
            title, description, chapterId, order, estimatedDuration, difficulty, learningObjectives, topics, tags, prerequisites, aiContext
        } = req.body;
        if (!title || !description || !chapterId || !order) {
            return res.status(400).json({
                status: "failed",
                message: "Missing required fields: title, description, chapterId, and order are required."
            });
        }

        //title verification
        if (!isValidString(title, 3, 150)) {
            return res.status(400).json({
                message: "Title must contain 3 to 150 characters.",
                status: "failed"
            })
        }

        //chapterid
        if (!mongoose.isValidObjectId(chapterId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid chapter ID."
            });
        }

        //order
        if (!Number.isInteger(order) || order < 0) {
            return res.status(400).json({
                status: "failed",
                message: "Order must be a positive integer."
            });
        }

        //description
        if (description !== undefined) {
            if (typeof description !== 'string' ||
                description.length > 2000
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Description must not exceed 2000 characters."
                });
            }
        }

        //estimatedDuration 
        if (estimatedDuration !== undefined &&
            (!Number.isFinite(estimatedDuration) ||
                estimatedDuration < 0)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Estimated duration must be a non-negative number."
            });
        }

        //difficulty 
        if (difficulty !== undefined &&
            !["beginner", "intermediate", "advanced"].includes(difficulty)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid difficulty."
            });
        }

        const chapter = await getOwnedChapter(
            chapterId,
            req.teacher._id
        )

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "Chapter not found or access denied."
            });
        }
        // Prerequisites must be valid, existing lessons.
        //it should beb array
        if (prerequisites !== undefined) {
            if (!Array.isArray(prerequisites)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Prerequisites must be an array."
                });
            }
        }
        //atleast one should be from prerequisites
        if (prerequisites.some(
            id => !mongoose.isValidObjectId(id)
        )) {
            return res.status(400).json({
                status: "failed",
                message: "A prerequisite lesson ID is invalid."
            });
        }

        const uniqueIds = [...new Set(
            prerequisites.map(String)
        )];

        if (uniqueIds.length !== prerequisites.length) {
            return res.status(400).json({
                status: "failed",
                message: "Duplicate prerequisites are not allowed."
            });
        }

        const existingLessons = await lessonModel.countDocuments({
            _id: { $in: prerequisites },
            createdBy: req.teacher._id,
            isArchived: false
        })

        if (existingLessons !== prerequisites.length) {
            return res.status(400).json({
                status: "failed",
                message: "One or more prerequisite lessons do not exist or are inaccessible."
            });
        }
        const lesson = await lessonModel.create({
            title: title.trim(),
            description: description?.trim() || "",
            chapterId: chapter._id,
            createdBy: req.teacher._id,
            order,
            estimatedDuration,
            difficulty,
            learningObjectives,
            topics,
            tags,
            prerequisites,
            aiContext
        });
        return res.status(201).json({
            status: "success",
            message: "Lesson created successfully.",
            data: lesson
        });

    } catch (error) {
        return sendError(res, error, "Create lesson error:");
    }
}

// GET ALL LESSONS CREATED BY TEACHER

const getMyLessons = async (req, res) => {
    try {
        const {
            chapterId,
            status,
            search,
            page = 1,
            limit = 20
        } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        //validatye pagenumber and limit
        if (!Number.isInteger(pageNumber) || pageNumber < 1 ||
            !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
            return res.status(400).json({
                status: "failed",
                message: "invalid pagination parameters"
            });
        }

        //filter so tht only tht teacher can se the content
        const filter = {
            createdBy: req.teacher._id,
            isArchived: false
        };

        //validate chapter id
        if (chapterId) {
            if (!mongoose.isValidObjectId(chapterId)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid chapter ID."
                });
            }

            //get the owned chapter
            const chapter = await getOwnedChapter(
                chapterId,
                req.teacher._id
            );

            if (!chapter) {
                return res.status(404).json({
                    status: "failed",
                    message: "Chapter not found or access denied."
                });
            }

            filter.chapterId = chapter._id;
        }
        //status
        // Status
        if (status !== undefined) {
            if (!["draft", "published"].includes(status)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Status must be draft or published."
                });
            }

            filter.status = status;
        }

        //search
        if (search !== undefined) {
            if (typeof search !== 'string'
                || search.trim().length > 100) {
                return res.status(400).json({
                    status: "failed",
                    message: "Search must not exceed 100 characters."
                });
            }
            filter.title = {
                $regex: search.trim().replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                ),
                $options: "i"
            };

        }

        //give content
        // Get lessons with pagination and count simultaneously
        const [lessons, total] = await Promise.all([
            lessonModel.find(filter)
                .populate("chapterId", "title subjectId order")
                .populate("prerequisites", "title order")
                .sort({ chapterId: 1, order: 1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .lean(),

            lessonModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            status: "success",
            count: lessons.length,
            total,
            page: pageNumber,
            pages: Math.ceil(total / pageSize),
            data: lessons
        });
    } catch (error) {
        return sendError(res, error, "Get lessons error:");

    }
};

//get one lesson
const getLessonById = async (req, res) => {
    try {
        const { lessonId } = req.params

        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid lesson ID."
            });
        }
        const lesson = await lessonModel.findOne({
            _id: lessonId,
            createdBy: req.teacher._id,
            isArchived: false
        })
            .populate("chapterId", "title subjectId order")
            .populate("prerequisites", "title order")
            .lean()
        if (!lesson) {
            return res.status(404).json({
                status: "failed",
                message: "Lesson not found or access denied."
            });
        }

        return res.status(200).json({
            status: "success",
            data: lesson
        });
    } catch (error) {
        return sendError(res, error, "Get lesson error:");
    }
}

// UPDATE LESSON METADATA

const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const fields = Object.keys(req.body);

        // Validate lesson ID
        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid lesson ID."
            });
        }

        // Validate editable fields
        if (
            fields.length === 0 ||
            fields.some(field => !editableFields.includes(field))
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Provide only supported lesson fields."
            });
        }

        // Retrieve lesson owned by this teacher
        const lesson = await lessonModel.findOne({
            _id: lessonId,
            createdBy: req.teacher._id,
            isArchived: false
        });

        if (!lesson) {
            return res.status(404).json({
                status: "failed",
                message: "Lesson not found or access denied."
            });
        }

        // Copy request body to avoid modifying req.body
        const updates = { ...req.body };

        // Validate title
        if (updates.title !== undefined) {
            if (!isValidString(updates.title, 3, 150)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Title must contain 3 to 150 characters."
                });
            }

            updates.title = updates.title.trim();
        }

        // Validate description
        if (updates.description !== undefined) {
            if (
                typeof updates.description !== "string" ||
                updates.description.trim().length > 2000
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid description."
                });
            }

            updates.description = updates.description.trim();
        }

        // Validate order
        if (updates.order !== undefined) {
            if (
                !Number.isInteger(updates.order) ||
                updates.order < 1
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Order must be a positive integer."
                });
            }
        }

        // Validate estimated duration
        if (updates.estimatedDuration !== undefined) {
            if (
                typeof updates.estimatedDuration !== "number" ||
                !Number.isFinite(updates.estimatedDuration) ||
                updates.estimatedDuration < 0
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid estimated duration."
                });
            }
        }

        // Validate difficulty
        if (updates.difficulty !== undefined) {
            if (
                !["beginner", "intermediate", "advanced"]
                    .includes(updates.difficulty)
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid difficulty."
                });
            }
        }

        // Validate prerequisites only when supplied
        if (updates.prerequisites !== undefined) {
            if (
                !Array.isArray(updates.prerequisites) ||
                updates.prerequisites.some(
                    id => !mongoose.isValidObjectId(id)
                )
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid prerequisites."
                });
            }

            // A lesson cannot depend on itself
            if (
                updates.prerequisites.some(
                    id => String(id) === String(lesson._id)
                )
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "A lesson cannot be its own prerequisite."
                });
            }

            // Remove duplicate prerequisite IDs
            const ids = [
                ...new Set(updates.prerequisites.map(String))
            ];

            if (ids.length !== updates.prerequisites.length) {
                return res.status(400).json({
                    status: "failed",
                    message: "Duplicate prerequisites are not allowed."
                });
            }

            // Ensure prerequisite lessons exist and belong to this teacher
            const count = await lessonModel.countDocuments({
                _id: { $in: ids },
                createdBy: req.teacher._id,
                isArchived: false
            });

            if (count !== ids.length) {
                return res.status(400).json({
                    status: "failed",
                    message: "A prerequisite is missing or inaccessible."
                });
            }

            updates.prerequisites = ids;
        }

        // Detect changes that require AI reprocessing
        const aiRelevantFields = [
            "title",
            "description",
            "learningObjectives",
            "topics",
            "tags",
            "aiContext"
        ];

        const aiRelevantChange = aiRelevantFields.some(
            field => updates[field] !== undefined
        );

        // Build update data
        const updateData = { ...updates };

        if (aiRelevantChange) {
            updateData.contentVersion =
                (lesson.contentVersion || 0) + 1;

            updateData["aiProcessing.status"] = "stale";
            updateData["aiProcessing.lastError"] = null;
        }

        // Update lesson while enforcing teacher ownership
        const updatedLesson = await lessonModel.findOneAndUpdate(
            {
                _id: lessonId,
                createdBy: req.teacher._id,
                isArchived: false
            },
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedLesson) {
            return res.status(404).json({
                status: "failed",
                message: "Lesson not found or access denied."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Lesson updated successfully.",
            data: updatedLesson
        });

    } catch (error) {
        return sendError(
            res,
            error,
            "Update lesson error:"
        );
    }
};


// PUBLISH LESSON
const publishLesson = async (req, res) => {
    try {
        const { lessonId } = req.params

        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid lesson ID."
            });
        }

        const lesson = await lessonModel.findOne({
            _id: lessonId,
            createdBy: req.teacher._id,
            isArchived: false
        })

        if (!lesson) {
            return res.status(404).json({
                status: "failed",
                message: "Lesson not found or access denied."
            });
        }

        if (!lesson.title || !lesson.chapterId) {
            return res.status(400).json({
                status: "failed",
                message: "Lesson is missing required content."
            });
        }
        lesson.status = "published";
        lesson.publishedAt = new Date();

        await lesson.save();

        return res.status(200).json({
            status: "success",
            message: "Lesson published successfully.",
            data: lesson
        });

    } catch (error) {
        return sendError(res, error, "Publish lesson error:");
    }
}

// UNPUBLISH LESSON
const unpublishLesson = async (req, res) => {
    try {
        const { lessonId } = req.params

        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid lesson ID."
            });
        }

        const lesson = await lessonModel.findOneAndUpdate(
            {
                _id: lessonId,
                createdBy: req.teacher._id,
                isArchived: false
            },
            {
                $set: {
                    status: "draft",
                    publishedAt: null
                }
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        )
        if (!lesson) {
            return res.status(404).json({
                status: "failed",
                message: "Lesson not found or already archived."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Lesson archived successfully.",
            data: lesson
        });

    } catch (error) {
        return sendError(res, error, "Archive lesson error:");
    }
}

//archive
const archiveLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid lesson ID."
            });
        }

        const lesson = await lessonModel.findOneAndUpdate(
            {
                _id: lessonId,
                createdBy: req.teacher._id,
                isArchived: false
            },
            {
                $set: {
                    isArchived: true,
                    status: "draft",
                    publishedAt: null
                }
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!lesson) {
            return res.status(404).json({
                status: "failed",
                message: "Lesson not found or already archived."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Lesson archived successfully.",
            data: lesson
        });

    } catch (error) {
        return sendError(res, error, "Archive lesson error:");
    }
};

// LIST LESSONS INSIDE A CHAPTER
const getLessonsByChapter = async (req, res) => {
    try {
        const { chapterId } = req.params;

        if (!mongoose.isValidObjectId(chapterId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid chapter ID."
            });
        }

        const chapter = await getOwnedChapter(
            chapterId,
            req.teacher._id
        );

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "Chapter not found or access denied."
            });
        }

        const lessons = await lessonModel.find({
            chapterId: chapter._id,
            createdBy: req.teacher._id,
            isArchived: false
        })
            .sort({ order: 1 })
            .lean();

        return res.status(200).json({
            status: "success",
            count: lessons.length,
            data: lessons
        });

    } catch (error) {
        return sendError(res, error, "Get chapter lessons error:");
    }
};

module.exports = {
    createLesson,
    getMyLessons,
    getLessonById,
    updateLesson,
    publishLesson,
    unpublishLesson,
    archiveLesson,
    getLessonsByChapter
};

// Promise.all() allows multiple asynchronous operations to run concurrently, rather than waiting for each one to finish before starting the next.


// chapterId: 1 — groups lessons by chapter ID in ascending order.

// order: 1 — sorts lessons within each chapter by their lesson order, from smallest to largest.