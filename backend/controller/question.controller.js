const mongoose = require("mongoose");

const Question = require("../model/question.model");
const Chapter = require("../model/chapter.model");
const { validateQuestion } = require("../utils/questionValidation.utils");

const getTeacherId = (req) => req.teacher?._id;
const editableFields = [
    "questionText",
    "questionType",
    "options",
    "correctOptions",
    "numericalAnswer",
    "numericalTolerance",
    "explanation",
    "difficulty",
    "subject",
    "chapterId",
    "topicTags",
    "marking",
];

const pickEditableFields = (body) =>
    Object.fromEntries(
        editableFields
            .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
            .map((field) => [field, body[field]])
    );

const validateOwnedChapter = async (chapterId, teacherId, res) => {
    if (!mongoose.isValidObjectId(chapterId)) {
        res.status(400).json({
            status: "failed",
            message: "A valid chapter ID is required.",
        });
        return null;
    }

    const chapter = await Chapter.findOne({
        _id: chapterId,
        createdBy: teacherId,
        isArchived: false,
    }).populate("subjectId", "name isActive");

    if (!chapter || !chapter.subjectId || chapter.subjectId.isActive === false) {
        res.status(404).json({
            status: "failed",
            message: "Chapter not found, inactive, or not owned by this teacher.",
        });
        return null;
    }

    const chapterSubject = String(chapter.subjectId.name || "")
        .replace(/[^a-z]/gi, "")
        .toUpperCase();
    const normalizedChapterSubject =
        chapterSubject === "MATHS" || chapterSubject === "MATH" ?
            "MATHEMATICS" : chapterSubject;

    if (normalizedChapterSubject !== undefined && normalizedChapterSubject) {
        return { chapter, subjectMatches: normalizedChapterSubject };
    }

    return { chapter, subjectMatches: null };
};

const checkSubjectMatchesChapter = (questionData, chapterInfo, res) => {
    if (
        chapterInfo.subjectMatches &&
        chapterInfo.subjectMatches !== questionData.subject
    ) {
        res.status(400).json({
            status: "failed",
            message: "Question subject must match the chapter subject.",
        });
        return false;
    }
    return true;
};

// POST /teachers/questions
const createQuestion = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        const data = pickEditableFields(req.body || {});
        const validation = validateQuestion(data);
        if (!validation.isValid) {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: validation.errors,
            });
        }

        const chapterInfo = await validateOwnedChapter(data.chapterId, teacherId, res);
        if (!chapterInfo) return;
        if (!checkSubjectMatchesChapter(data, chapterInfo, res)) return;

        const question = await Question.create({
            ...data,
            createdBy: teacherId,
        });

        return res.status(201).json({
            status: "success",
            message: "Question created successfully.",
            data: { question },
        });
    } catch (error) {
        console.error("Create question error:", error);
        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: Object.values(error.errors).map((item) => item.message),
            });
        }
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while creating the question.",
        });
    }
};

// GET /teachers/questions
const getTeacherQuestions = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        const { chapterId, subject, difficulty, questionType, active } = req.query;
        const filter = { createdBy: teacherId };

        if (chapterId !== undefined) {
            if (!mongoose.isValidObjectId(chapterId)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid chapter ID.",
                });
            }
            filter.chapterId = chapterId;
        }
        if (subject !== undefined) {
            if (!["PHYSICS", "CHEMISTRY", "MATHEMATICS"].includes(subject)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid subject filter.",
                });
            }
            filter.subject = subject;
        }
        if (difficulty !== undefined) {
            if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid difficulty filter.",
                });
            }
            filter.difficulty = difficulty;
        }
        if (questionType !== undefined) {
            if (!["SINGLE_CORRECT", "MULTIPLE_CORRECT", "NUMERICAL"].includes(questionType)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid question type filter.",
                });
            }
            filter.questionType = questionType;
        }
        if (active !== undefined) {
            if (!["true", "false"].includes(active)) {
                return res.status(400).json({
                    status: "failed",
                    message: "The active filter must be true or false.",
                });
            }
            filter.isActive = active === "true";
        } else {
            filter.isActive = true;
        }

        const page = Number.parseInt(req.query.page ?? "1", 10);
        const limit = Number.parseInt(req.query.limit ?? "20", 10);
        if (!Number.isInteger(page) || page < 1 ||
            !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                status: "failed",
                message: "Page must be positive and limit must be between 1 and 100.",
            });
        }

        const [questions, total] = await Promise.all([
            Question.find(filter)
                .select("-__v")
                .populate("chapterId", "title subjectId")
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Question.countDocuments(filter),
        ]);

        return res.status(200).json({
            status: "success",
            data: {
                questions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get teacher questions error:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while retrieving questions.",
        });
    }
};

// GET /teachers/questions/:questionId
const getQuestionById = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { questionId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }
        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid question ID.",
            });
        }

        const question = await Question.findOne({
            _id: questionId,
            createdBy: teacherId,
        }).populate("chapterId", "title subjectId").lean();

        if (!question) {
            return res.status(404).json({
                status: "failed",
                message: "Question not found.",
            });
        }

        return res.status(200).json({
            status: "success",
            data: { question },
        });
    } catch (error) {
        console.error("Get question error:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while retrieving the question.",
        });
    }
};

// PATCH /teachers/questions/:questionId
const updateQuestion = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { questionId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }
        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid question ID.",
            });
        }

        const question = await Question.findOne({
            _id: questionId,
            createdBy: teacherId,
            isActive: true,
        });
        if (!question) {
            return res.status(404).json({
                status: "failed",
                message: "Active question not found.",
            });
        }

        const updates = pickEditableFields(req.body || {});
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                status: "failed",
                message: "Provide at least one supported question field to update.",
            });
        }

        const merged = {
            ...question.toObject(),
            ...updates,
            chapterId: String(updates.chapterId ?? question.chapterId),
            marking: updates.marking ?? question.marking?.toObject?.() ?? question.marking,
        };
        const validation = validateQuestion(merged);
        if (!validation.isValid) {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: validation.errors,
            });
        }

        const chapterInfo = await validateOwnedChapter(merged.chapterId, teacherId, res);
        if (!chapterInfo) return;
        if (!checkSubjectMatchesChapter(merged, chapterInfo, res)) return;

        for (const [field, value] of Object.entries(updates)) {
            question.set(field, value);
        }
        await question.save();

        return res.status(200).json({
            status: "success",
            message: "Question updated successfully.",
            data: { question },
        });
    } catch (error) {
        console.error("Update question error:", error);
        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: Object.values(error.errors).map((item) => item.message),
            });
        }
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while updating the question.",
        });
    }
};

// DELETE /teachers/questions/:questionId (soft-deactivate)
const archiveQuestion = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { questionId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }
        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid question ID.",
            });
        }

        const question = await Question.findOneAndUpdate(
            { _id: questionId, createdBy: teacherId, isActive: true },
            { $set: { isActive: false } },
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({
                status: "failed",
                message: "Active question not found.",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Question deactivated successfully.",
            data: { question },
        });
    } catch (error) {
        console.error("Archive question error:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while deactivating the question.",
        });
    }
};

module.exports = {
    createQuestion,
    getTeacherQuestions,
    getQuestionById,
    updateQuestion,
    archiveQuestion,
};
