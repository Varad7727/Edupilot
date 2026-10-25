const mongoose = require('mongoose')

const DPP = require("../model/dpp.model")
const Chapter = require("../model/chapter.model")
const Question = require("../model/question.model")
const { validateQuestion } = require("../utils/questionValidation.utils");
// Helper: get the logged-in teacher's ID.
const getTeacherId = (req) => req.teacher?._id;
const QUESTION_FIELDS = [
    "questionText",
    "questionType",
    "options",
    "correctOptions",
    "numericalAnswer",
    "numericalTolerance",
    "explanation",
    "image",
    "difficulty",
    "subject",
    "topicTags",
    "marking",
];

// Helper: calculate total marks from saved question documents.
const calculateTotalMarks = (questions) => {
    return questions.reduce((total, question) => {
        return total + (question.marking?.correctMarks ?? 4);
    }, 0);
};

// POST /teachers/dpps

const createDPP = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req);

        // 1. Authenticate teacher
        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        const {
            title,
            description,
            instructions,
            chapterId,
            questions,
            durationMinutes,
            deadline,
            creationMethod,
        } = req.body;

        // 2. Validate title
        if (
            typeof title !== "string" ||
            title.trim().length < 2 ||
            title.trim().length > 150
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Title must contain between 2 and 150 characters.",
            });
        }

        // 3. Validate chapter ID
        if (!mongoose.isValidObjectId(chapterId)) {
            return res.status(400).json({
                status: "failed",
                message: "A valid chapter ID is required.",
            });
        }

        // 4. Validate questions array
        const questionList = questions ?? [];

        if (!Array.isArray(questionList)) {
            return res.status(400).json({
                status: "failed",
                message: "Questions must be an array.",
            });
        }

        // 5. Validate duration
        if (
            !Number.isInteger(durationMinutes) ||
            durationMinutes < 1 ||
            durationMinutes > 600
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Duration must be an integer between 1 and 600 minutes.",
            });
        }

        // 6. Validate deadline
        const deadlineDate = new Date(deadline);

        if (
            !deadline ||
            Number.isNaN(deadlineDate.getTime()) ||
            deadlineDate <= new Date()
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Deadline must be a valid future date.",
            });
        }

        // 7. Validate optional text fields
        if (
            description !== undefined &&
            (
                typeof description !== "string" ||
                description.length > 2000
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Description must be a string of at most 2000 characters.",
            });
        }

        if (
            instructions !== undefined &&
            (
                typeof instructions !== "string" ||
                instructions.length > 5000
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Instructions must be a string of at most 5000 characters.",
            });
        }

        // 8. Validate creation method
        if (
            creationMethod !== undefined &&
            !["MANUAL", "PDF", "IMAGE", "MIXED"].includes(creationMethod)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP creation method.",
            });
        }

        // 9. Verify chapter ownership
        const chapter = await Chapter.findOne({
            _id: chapterId,
            createdBy: teacherId,
            isArchived: false,
        });

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "Chapter not found or you do not have permission to use it.",
            });
        }

        // 10. Validate question references and order
        const questionIds = [];
        const orderValues = [];

        for (const item of questionList) {
            if (
                !item ||
                typeof item !== "object" ||
                !mongoose.isValidObjectId(item.questionId) ||
                !Number.isInteger(item.order) ||
                item.order < 1
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Every question must have a valid questionId and positive integer order.",
                });
            }

            questionIds.push(item.questionId.toString());
            orderValues.push(item.order);
        }

        // Reject duplicate question IDs
        if (new Set(questionIds).size !== questionIds.length) {
            return res.status(400).json({
                status: "failed",
                message: "A question cannot appear more than once in a DPP.",
            });
        }

        // Reject duplicate order values
        if (new Set(orderValues).size !== orderValues.length) {
            return res.status(400).json({
                status: "failed",
                message: "Question order values must be unique.",
            });
        }

        // Ensure order is continuous: 1, 2, 3, ...
        const sortedOrders = [...orderValues].sort((a, b) => a - b);

        if (
            sortedOrders.some((order, index) => order !== index + 1)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Question order must start at 1 and be continuous.",
            });
        }

        // 11. Verify all questions belong to this chapter and are active
        const savedQuestions = questionIds.length > 0
            ? await Question.find({
                _id: { $in: questionIds },
                chapterId,
                isActive: true,
            }).select("_id marking")
            : [];

        if (savedQuestions.length !== questionIds.length) {
            return res.status(400).json({
                status: "failed",
                message: "One or more questions are missing, inactive, or do not belong to this chapter.",
            });
        }

        // 12. Build question lookup map
        const questionMap = new Map(
            savedQuestions.map((question) => [
                question._id.toString(),
                question,
            ])
        );

        // Preserve the teacher's requested question order
        const orderedQuestions = questionList.map((item) => ({
            questionId: item.questionId,
            order: item.order,
        }));

        // 13. Calculate total marks on the server
        const orderedQuestionDocs = orderedQuestions.map((item) =>
            questionMap.get(item.questionId.toString())
        );

        const totalMarks = orderedQuestionDocs.length > 0
            ? calculateTotalMarks(orderedQuestionDocs)
            : 0;

        // 14. Create DPP as a draft
        const dpp = await DPP.create({
            title: title.trim(),
            description: description?.trim() ?? "",
            instructions: instructions?.trim() ?? "",
            chapterId,
            questions: orderedQuestions,
            durationMinutes,
            deadline: deadlineDate,
            totalMarks,
            creationMethod: creationMethod ?? "MANUAL",
            status: "draft",
            createdBy: teacherId,
        });

        return res.status(201).json({
            status: "success",
            message: "DPP created successfully as a draft.",
            data: { dpp },
        });

    } catch (error) {
        console.error("Create DPP error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "DPP validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while creating the DPP.",
        });
    }
};


// GET /teachers/dpps
const getTeacherDPPs = async (req, res) => {
    try {
        const teacherId = getTeacherId(req)
        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }
        const dpps = await DPP.find({
            createdBy: teacherId,
            isArchived: false
        })
            .populate("chapterId", "title subjectId")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            status: "success",
            results: dpps.length,
            data: { dpps },
        });
    } catch (error) {
        console.error("Get teacher DPPs error:", error);

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while retrieving DPPs.",
        });
    }
};
// GET /teachers/dpps/:dppId
const getDPPById = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { dppId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        if (!mongoose.isValidObjectId(dppId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP ID.",
            });
        }

        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
        })
            .populate("chapterId", "title subjectId")
            .populate({
                path: "questions.questionId",
                select: "questionText questionType options difficulty subject topicTags marking explanation image",
            })
            .lean();

        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "DPP not found.",
            });
        }

        return res.status(200).json({
            status: "success",
            data: { dpp },
        });
    } catch (error) {
        console.error("Get DPP by ID error:", error);

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while retrieving the DPP.",
        });
    }
};

//write questions

const addQuestionToDPP = async (req, res) => {
    let createdQuestionId;

    try {
        const teacherId = req.teacher?._id;
        const { dppId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        if (!mongoose.isValidObjectId(dppId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP ID.",
            });
        }

        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
            status: "draft",
        });

        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "Draft DPP not found or not owned by this teacher.",
            });
        }

        // Only accept fields the teacher is allowed to provide.
        const data = Object.fromEntries(
            QUESTION_FIELDS
                .filter((field) =>
                    Object.prototype.hasOwnProperty.call(
                        req.body || {},
                        field
                    )
                )
                .map((field) => [field, req.body[field]])
        );

        // Never trust the client to choose the chapter or question owner.
        data.chapterId = String(dpp.chapterId);

        const validation = validateQuestion(data);

        if (!validation.isValid) {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: validation.errors,
            });
        }

        const chapter = await Chapter.findOne({
            _id: dpp.chapterId,
            createdBy: teacherId,
            isArchived: false,
        }).populate("subjectId", "name code");

        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "DPP chapter not found or not owned by this teacher.",
            });
        }

        // If the chapter subject is recognized, enforce a subject match.
        const chapterSubjectName = String(
            chapter.subjectId?.name || chapter.subjectId?.code || ""
        )
            .replace(/[^a-z]/gi, "")
            .toUpperCase();

        const normalizedChapterSubject =
            chapterSubjectName === "MATH" ||
                chapterSubjectName === "MATHS"
                ? "MATHEMATICS"
                : chapterSubjectName;

        if (
            ["PHYSICS", "CHEMISTRY", "MATHEMATICS"].includes(
                normalizedChapterSubject
            ) &&
            normalizedChapterSubject !== data.subject
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Question subject must match the DPP chapter subject.",
            });
        }

        const question = await Question.create({
            ...data,
            createdBy: teacherId,
        });

        createdQuestionId = question._id;

        const nextOrder =
            dpp.questions.reduce(
                (maxOrder, item) => Math.max(maxOrder, item.order),
                0
            ) + 1;

        dpp.questions.push({
            questionId: question._id,
            order: nextOrder,
        });

        const questionDocs = await Question.find({
            _id: {
                $in: dpp.questions.map((item) => item.questionId),
            },
            isActive: true,
        }).select("_id marking");

        dpp.totalMarks = questionDocs.reduce(
            (total, item) =>
                total + (item.marking?.correctMarks ?? 4),
            0
        );

        await dpp.save();

        return res.status(201).json({
            status: "success",
            message: "Question added to DPP successfully.",
            data: {
                question,
                order: nextOrder,
                totalMarks: dpp.totalMarks,
            },
        });
    } catch (error) {
        // Remove the new question if saving the DPP fails.
        if (createdQuestionId) {
            await Question.deleteOne({
                _id: createdQuestionId,
            }).catch(() => { });
        }

        console.error("Add question to DPP error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while adding the question.",
        });
    }
};

// PATCH /teachers/dpps/:dppId
const updateDPP = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { dppId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        if (!mongoose.isValidObjectId(dppId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP ID.",
            });
        }

        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
            status: "draft",
        });

        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "Draft DPP not found or not owned by this teacher.",
            });
        }

        const body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json({
                status: "failed",
                message: "DPP update data must be an object.",
            });
        }

        const allowedFields = [
            "title",
            "description",
            "instructions",
            "durationMinutes",
            "deadline",
            "creationMethod",
        ];
        const updates = Object.fromEntries(
            allowedFields
                .filter((field) =>
                    Object.prototype.hasOwnProperty.call(body, field)
                )
                .map((field) => [field, body[field]])
        );

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                status: "failed",
                message: "Provide at least one supported DPP field to update.",
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "title") &&
            (
                typeof updates.title !== "string" ||
                updates.title.trim().length < 2 ||
                updates.title.trim().length > 150
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Title must contain between 2 and 150 characters.",
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "description") &&
            (
                typeof updates.description !== "string" ||
                updates.description.length > 2000
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Description must be a string of at most 2000 characters.",
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "instructions") &&
            (
                typeof updates.instructions !== "string" ||
                updates.instructions.length > 5000
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Instructions must be a string of at most 5000 characters.",
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "durationMinutes") &&
            (
                !Number.isInteger(updates.durationMinutes) ||
                updates.durationMinutes < 1 ||
                updates.durationMinutes > 600
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Duration must be an integer between 1 and 600 minutes.",
            });
        }

        if (Object.prototype.hasOwnProperty.call(updates, "deadline")) {
            const deadlineDate = new Date(updates.deadline);
            if (
                !updates.deadline ||
                Number.isNaN(deadlineDate.getTime()) ||
                deadlineDate <= new Date()
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Deadline must be a valid future date.",
                });
            }
            updates.deadline = deadlineDate;
        }

        if (
            Object.prototype.hasOwnProperty.call(updates, "creationMethod") &&
            !["MANUAL", "PDF", "IMAGE", "MIXED"].includes(
                updates.creationMethod
            )
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP creation method.",
            });
        }

        if (updates.title !== undefined) updates.title = updates.title.trim();
        if (updates.description !== undefined) {
            updates.description = updates.description.trim();
        }
        if (updates.instructions !== undefined) {
            updates.instructions = updates.instructions.trim();
        }

        Object.assign(dpp, updates);
        await dpp.save();

        return res.status(200).json({
            status: "success",
            message: "DPP updated successfully.",
            data: { dpp },
        });
    } catch (error) {
        console.error("Update DPP error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "DPP validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while updating the DPP.",
        });
    }
};

// PATCH /teachers/dpps/:dppId/questions/:questionId
const updateQuestionInDPP = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { dppId, questionId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        if (
            !mongoose.isValidObjectId(dppId) ||
            !mongoose.isValidObjectId(questionId)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP or question ID.",
            });
        }

        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
            status: "draft",
        });

        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "Draft DPP not found or not owned by this teacher.",
            });
        }

        const dppQuestion = dpp.questions.find(
            (item) => item.questionId.toString() === questionId
        );
        if (!dppQuestion) {
            return res.status(404).json({
                status: "failed",
                message: "Question is not part of this DPP.",
            });
        }

        const body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return res.status(400).json({
                status: "failed",
                message: "Question update data must be an object.",
            });
        }

        const updates = Object.fromEntries(
            QUESTION_FIELDS
                .filter((field) =>
                    Object.prototype.hasOwnProperty.call(body, field)
                )
                .map((field) => [field, body[field]])
        );
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                status: "failed",
                message: "Provide at least one supported question field to update.",
            });
        }

        const question = await Question.findOne({
            _id: questionId,
            chapterId: dpp.chapterId,
            createdBy: teacherId,
            isActive: true,
        });
        if (!question) {
            return res.status(404).json({
                status: "failed",
                message: "Active question not found in the DPP chapter.",
            });
        }

        const validation = validateQuestion({
            ...question.toObject(),
            ...updates,
            chapterId: dpp.chapterId.toString(),
        });
        if (!validation.isValid) {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: validation.errors,
            });
        }

        const chapter = await Chapter.findOne({
            _id: dpp.chapterId,
            createdBy: teacherId,
            isArchived: false,
        }).populate("subjectId", "name code");
        if (!chapter) {
            return res.status(404).json({
                status: "failed",
                message: "DPP chapter not found or not owned by this teacher.",
            });
        }

        const chapterSubjectName = String(
            chapter.subjectId?.name || chapter.subjectId?.code || ""
        )
            .replace(/[^a-z]/gi, "")
            .toUpperCase();
        const normalizedChapterSubject =
            chapterSubjectName === "MATH" ||
                chapterSubjectName === "MATHS"
                ? "MATHEMATICS"
                : chapterSubjectName;

        if (
            ["PHYSICS", "CHEMISTRY", "MATHEMATICS"].includes(
                normalizedChapterSubject
            ) &&
            normalizedChapterSubject !== (updates.subject ?? question.subject)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Question subject must match the DPP chapter subject.",
            });
        }

        Object.assign(question, updates);
        await question.save();

        const questions = await Question.find({
            _id: {
                $in: dpp.questions.map((item) => item.questionId),
            },
            isActive: true,
        }).select("_id marking");
        dpp.totalMarks = calculateTotalMarks(questions);
        await dpp.save();

        return res.status(200).json({
            status: "success",
            message: "Question updated successfully.",
            data: {
                question,
                order: dppQuestion.order,
                totalMarks: dpp.totalMarks,
            },
        });
    } catch (error) {
        console.error("Update question in DPP error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "Question validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while updating the question.",
        });
    }
};

// DELETE /teachers/dpps/:dppId/questions/:questionId
const removeQuestionFromDPP = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { dppId, questionId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        if (
            !mongoose.isValidObjectId(dppId) ||
            !mongoose.isValidObjectId(questionId)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP or question ID.",
            });
        }

        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
            status: "draft",
        });

        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "Draft DPP not found or not owned by this teacher.",
            });
        }

        const questionIndex = dpp.questions.findIndex(
            (item) => item.questionId.toString() === questionId
        );
        if (questionIndex === -1) {
            return res.status(404).json({
                status: "failed",
                message: "Question is not part of this DPP.",
            });
        }

        dpp.questions.splice(questionIndex, 1);
        dpp.questions.forEach((item, index) => {
            item.order = index + 1;
        });

        const questions = dpp.questions.length
            ? await Question.find({
                _id: {
                    $in: dpp.questions.map((item) => item.questionId),
                },
                isActive: true,
            }).select("_id marking")
            : [];
        dpp.totalMarks = calculateTotalMarks(questions);
        await dpp.save();

        return res.status(200).json({
            status: "success",
            message: "Question removed from DPP successfully.",
            data: {
                dppId: dpp._id,
                removedQuestionId: questionId,
                totalMarks: dpp.totalMarks,
                questions: dpp.questions,
            },
        });
    } catch (error) {
        console.error("Remove question from DPP error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "DPP validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while removing the question.",
        });
    }
};

// PATCH /teachers/dpps/:dppId/questions/reorder
const reorderDPPQuestions = async (req, res) => {
    try {
        const teacherId = getTeacherId(req);
        const { dppId } = req.params;

        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        if (!mongoose.isValidObjectId(dppId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP ID.",
            });
        }

        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
            status: "draft",
        });
        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "Draft DPP not found or not owned by this teacher.",
            });
        }

        const reorderedQuestions = req.body?.questions;
        if (!Array.isArray(reorderedQuestions)) {
            return res.status(400).json({
                status: "failed",
                message: "Questions must be an array of questionId and order values.",
            });
        }

        if (reorderedQuestions.length !== dpp.questions.length) {
            return res.status(400).json({
                status: "failed",
                message: "Reorder must include every question currently in the DPP exactly once.",
            });
        }

        const existingQuestionIds = new Set(
            dpp.questions.map((item) => item.questionId.toString())
        );
        const submittedIds = [];
        const submittedOrders = [];
        for (const item of reorderedQuestions) {
            if (
                !item ||
                typeof item !== "object" ||
                !mongoose.isValidObjectId(item.questionId) ||
                !Number.isInteger(item.order) ||
                item.order < 1
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Every reordered question needs a valid questionId and positive integer order.",
                });
            }

            submittedIds.push(item.questionId.toString());
            submittedOrders.push(item.order);
        }

        if (
            new Set(submittedIds).size !== submittedIds.length ||
            submittedIds.some((id) => !existingQuestionIds.has(id))
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Reorder must contain each existing DPP question exactly once.",
            });
        }

        const sortedOrders = [...submittedOrders].sort((a, b) => a - b);
        if (
            new Set(submittedOrders).size !== submittedOrders.length ||
            sortedOrders.some((order, index) => order !== index + 1)
        ) {
            return res.status(400).json({
                status: "failed",
                message: "Question order must be unique and continuous starting at 1.",
            });
        }

        dpp.questions = reorderedQuestions.map((item) => ({
            questionId: item.questionId,
            order: item.order,
        }));
        await dpp.save();

        return res.status(200).json({
            status: "success",
            message: "DPP questions reordered successfully.",
            data: { questions: dpp.questions },
        });
    } catch (error) {
        console.error("Reorder DPP questions error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "DPP validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while reordering DPP questions.",
        });
    }
};

//publish dpp
const publishDPP = async (req, res) => {
    try {
        const teacherId = req.teacher?._id
        const { dppId } = req.params

        // 1. Verify teacher authentication
        if (!teacherId) {
            return res.status(401).json({
                status: "failed",
                message: "Teacher authentication is required.",
            });
        }

        // 2. Validate DPP ID
        if (!mongoose.isValidObjectId(dppId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid DPP ID.",
            });
        }

        // 3. Find the teacher's own, non-archived DPP
        const dpp = await DPP.findOne({
            _id: dppId,
            createdBy: teacherId,
            isArchived: false,
        })
        if (!dpp) {
            return res.status(404).json({
                status: "failed",
                message: "DPP not found or you do not have permission to access it.",
            });
        }

        // 4. Only drafts can be published
        if (dpp.status !== "draft") {
            return res.status(400).json({
                status: "failed",
                message: "Only draft DPPs can be published.",
            });
        }

        // 5. A published DPP must contain at least one question
        if (!dpp.questions || dpp.questions.length === 0) {
            return res.status(400).json({
                status: "failed",
                message: "Add at least one question before publishing the DPP.",
            });
        }

        // 6. Require a future deadline
        if (
            !dpp.deadline ||
            Number.isNaN(new Date(dpp.deadline).getTime()) ||
            new Date(dpp.deadline) <= new Date()
        ) {
            return res.status(400).json({
                status: "failed",
                message: "The DPP deadline must be in the future before publishing.",
            });
        }

        // 7. Confirm the chapter still belongs to this teacher
        const chapter = await Chapter.findOne({
            _id: dpp.chapterId,
            createdBy: teacherId,
            isArchived: false,
        });

        if (!chapter) {
            return res.status(400).json({
                status: "failed",
                message: "The DPP chapter is unavailable or archived.",
            });
        }

        // 8. Verify all referenced questions are active and belong
        // to the DPP's chapter.
        //extract all ids
        const questionIds = dpp.questions.map(
            (item) => item.questionId
        )

        const questionDocs = await Question.find({
            _id: { $in: questionIds },
            chapterId: dpp.chapterId,
            isActive: true,
        }).select("_id marking");

        if (questionDocs.length !== questionIds.length) {
            return res.status(400).json({
                status: "failed",
                message: "One or more DPP questions are missing, inactive, or belong to another chapter.",
            });
        }
        // 9. Recalculate total marks using database question data
        dpp.totalMarks = calculateTotalMarks(questionDocs);

        // 10. Publish the DPP
        dpp.status = "published";

        await dpp.save();

        return res.status(200).json({
            status: "success",
            message: "DPP published successfully.",
            data: {
                dpp,
            },
        });


    } catch (error) {
        console.error("Publish DPP error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "failed",
                message: "DPP validation failed.",
                errors: Object.values(error.errors).map(
                    (item) => item.message
                ),
            });
        }
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred while publishing the DPP.",
        });

    }
}


    module.exports = {
        createDPP,
        getTeacherDPPs,
        getDPPById,
        addQuestionToDPP,
        updateDPP,
        updateQuestionInDPP,
        removeQuestionFromDPP,
        reorderDPPQuestions,
        publishDPP
    };


// What is new Set()?
// In JavaScript, a Set is a collection that stores only unique values. If you add the same value multiple times, it keeps only one copy.


// What does [...orderValues] mean?
// The ... is called the spread operator.
// It takes the elements from an array and puts them into a new array copy