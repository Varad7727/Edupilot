
const mongoose = require("mongoose");

const Attempt = require("../model/studentDppAttempt.model.js");
const DPP = require("../model/dpp.model.js");
const Question = require("../model/question.model.js");
const Enrollment = require("../model/enrollment.model.js");
const Chapter = require("../model/chapter.model.js");
const Subject = require("../model/subject.model.js");

const {
    finalizeExpiredAttempt
} = require("../utils/dppAttempt.utils.js");

const validId = (id) => mongoose.isValidObjectId(id);

const FINAL_STATUSES = ["SUBMITTED", "AUTO_SUBMITTED"];

function getAttemptSummary(attempt) {
    return {
        attemptId: attempt._id,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        accuracy: attempt.accuracy
    };
}

function getOrderedQuestionIds(dpp) {
    return (dpp.questions || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item) => item.questionId);
}

async function getAccessibleDpp(studentId, dppId) {
    const dpp = await DPP.findOne({
        _id: dppId,
        status: "published",
        isArchived: false
    }).lean();

    if (!dpp) return null;

    const chapter = await Chapter.findOne({
        _id: dpp.chapterId,
        status: "published",
        isArchived: false
    }).lean();

    if (!chapter) return null;

    const subject = await Subject.findOne({
        _id: chapter.subjectId,
        isActive: true
    }).lean();

    if (!subject) return null;

    const enrollments = await Enrollment.find({
        student: studentId,
        status: "active"
    })
        .populate({
            path: "course",
            match: { isActive: true },
            select: "_id"
        })
        .lean();

    const isEnrolled = enrollments.some((enrollment) => (
        enrollment.course &&
        String(enrollment.course._id) === String(subject.courseId)
    ));

    return isEnrolled ? dpp : null;
}

function publicQuestion(question, index) {
    return {
        questionId: question._id,
        number: index + 1,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        image: question.image,
        difficulty: question.difficulty,
        topicTags: question.topicTags || [],
        marks: question.marking?.correctMarks ?? 4,
        negativeMarks: question.marking?.incorrectMarks ?? -1
    };
}

function sanitizeAnswers(answers = []) {
    return answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOptions: answer.selectedOptions || [],
        numericalAnswer: answer.numericalAnswer ?? null,
        markedForReview: Boolean(answer.markedForReview),
        visited: Boolean(answer.visited)
    }));
}

function gradeQuestion(question, answer) {
    const selected = [
        ...new Set(answer?.selectedOptions || [])
    ].sort();

    const correct = [
        ...new Set(question.correctOptions || [])
    ].sort();

    const marking = question.marking || {};

    const correctMarks = Number(marking.correctMarks ?? 4);
    const incorrectMarks = Number(marking.incorrectMarks ?? -1);
    const unattemptedMarks = Number(marking.unattemptedMarks ?? 0);

    let attempted = false;
    let isCorrect = false;
    let marks = unattemptedMarks;

    if (question.questionType === "NUMERICAL") {
        const value = answer?.numericalAnswer;

        attempted = value !== null &&
            value !== undefined &&
            value !== "";

        if (attempted && Number.isFinite(Number(value))) {
            const expected = Number(question.numericalAnswer);
            const tolerance = Number(question.numericalTolerance || 0);

            isCorrect = Math.abs(Number(value) - expected) <= tolerance;
            marks = isCorrect ? correctMarks : incorrectMarks;
        } else if (attempted) {
            marks = incorrectMarks;
        }
    } else {
        attempted = selected.length > 0;

        if (attempted) {
            isCorrect =
                selected.length === correct.length &&
                selected.every((key, index) => key === correct[index]);

            if (isCorrect) {
                marks = correctMarks;
            } else if (question.questionType === "MULTIPLE_CORRECT") {
                const rule = (
                    marking.partialMarkingRules || []
                ).find((item) => {
                    const ruleKeys = [
                        ...new Set(item.selectedOptions || [])
                    ].sort();

                    return (
                        ruleKeys.length === selected.length &&
                        ruleKeys.every((key, index) => key === selected[index])
                    );
                });

                marks = rule
                    ? Number(rule.marks)
                    : incorrectMarks;
            } else {
                marks = incorrectMarks;
            }
        }
    }

    return {
        attempted,
        isCorrect,
        marks,
        correctAnswer: question.questionType === "NUMERICAL"
            ? question.numericalAnswer
            : correct,
        explanation: question.explanation || ""
    };
}

function isExpired(attempt, dpp, now = Date.now()) {
    if (attempt.mode !== "EXAM") return false;

    const startedAt = new Date(attempt.startedAt).getTime();
    const durationMs = Number(dpp.durationMinutes) * 60 * 1000;

    return now >= startedAt + durationMs;
}

// POST /students/dpps/:dppId/attempts
exports.startAttempt = async (req, res) => {
    try {
        const studentId = req.student?._id;
        const { dppId } = req.params;
        const mode = String(req.body?.mode || "").toUpperCase();

        if (!studentId) {
            return res.status(401).json({
                message: "Student authentication required."
            });
        }

        if (!validId(dppId) || !["PRACTICE", "EXAM"].includes(mode)) {
            return res.status(400).json({
                message: "Valid DPP ID and mode are required."
            });
        }

        const dpp = await getAccessibleDpp(studentId, dppId);

        if (!dpp) {
            return res.status(404).json({
                message: "DPP not found or not accessible."
            });
        }

        const questionIds = getOrderedQuestionIds(dpp);

        if (!questionIds.length) {
            return res.status(400).json({
                message: "This DPP has no questions."
            });
        }

        const questions = await Question.find({
            _id: { $in: questionIds },
            isActive: true
        }).lean();

        const questionById = new Map(
            questions.map((question) => [
                String(question._id),
                question
            ])
        );

        const orderedQuestions = questionIds
            .map((id) => questionById.get(String(id)))
            .filter(Boolean);

        if (!orderedQuestions.length) {
            return res.status(400).json({
                message: "No active questions are available."
            });
        }

        const attempt = await Attempt.create({
            student: studentId,
            dpp: dpp._id,
            mode,
            maxScore: orderedQuestions.reduce(
                (sum, question) => (
                    sum + Number(question.marking?.correctMarks ?? 4)
                ),
                0
            ),
            answers: orderedQuestions.map((question) => ({
                questionId: question._id
            }))
        });

        const deadline = mode === "EXAM"
            ? new Date(
                new Date(attempt.startedAt).getTime() +
                Number(dpp.durationMinutes) * 60 * 1000
            )
            : null;

        return res.status(201).json({
            message: "Attempt started.",
            data: {
                attemptId: attempt._id,
                mode,
                startedAt: attempt.startedAt,
                durationMinutes: mode === "EXAM"
                    ? dpp.durationMinutes
                    : null,
                deadline,
                questions: orderedQuestions.map(publicQuestion)
            }
        });
    } catch (error) {
        console.error("startAttempt:", error);

        return res.status(500).json({
            message: "Unable to start attempt."
        });
    }
};

// PATCH /students/dpps/attempts/:attemptId/answers
exports.saveAnswer = async (req, res) => {
    try {
        const studentId = req.student?._id;
        const { attemptId } = req.params;

        const {
            questionId,
            selectedOptions = [],
            numericalAnswer = null,
            markedForReview = false,
            visited = true
        } = req.body || {};

        if (!studentId) {
            return res.status(401).json({
                message: "Student authentication required."
            });
        }

        if (!validId(attemptId) || !validId(questionId)) {
            return res.status(400).json({
                message: "Invalid attempt or question ID."
            });
        }

        if (
            !Array.isArray(selectedOptions) ||
            !selectedOptions.every((value) => typeof value === "string")
        ) {
            return res.status(400).json({
                message: "selectedOptions must be an array of strings."
            });
        }

        if (
            numericalAnswer !== null &&
            (
                typeof numericalAnswer !== "number" ||
                !Number.isFinite(numericalAnswer)
            )
        ) {
            return res.status(400).json({
                message: "numericalAnswer must be a finite number or null."
            });
        }

        const attempt = await Attempt.findOne({
            _id: attemptId,
            student: studentId
        });

        if (!attempt) {
            return res.status(404).json({
                message: "Attempt not found."
            });
        }

        if (attempt.status === "FINALIZING") {
            return res.status(409).json({
                message: "Your attempt is being finalized.",
                status: "FINALIZING"
            });
        }

        if (attempt.status !== "IN_PROGRESS") {
            return res.status(409).json({
                message: "This attempt is no longer accepting answers.",
                status: attempt.status
            });
        }

        const dpp = await DPP.findById(attempt.dpp).lean();

        if (!dpp) {
            return res.status(404).json({
                message: "DPP not found."
            });
        }

        if (isExpired(attempt, dpp)) {
            await finalizeExpiredAttempt(attempt._id);

            const latestAttempt = await Attempt.findOne({
                _id: attempt._id,
                student: studentId
            }).lean();

            if (
                latestAttempt &&
                FINAL_STATUSES.includes(latestAttempt.status)
            ) {
                return res.status(409).json({
                    message: "Exam time expired. Your attempt was automatically submitted.",
                    expired: true,
                    data: getAttemptSummary(latestAttempt)
                });
            }

            return res.status(409).json({
                message: "Exam time expired. Your result is being finalized.",
                expired: true
            });
        }

        const belongsToDpp = (dpp.questions || []).some((item) => (
            String(item.questionId) === String(questionId)
        ));

        if (!belongsToDpp) {
            return res.status(400).json({
                message: "Question does not belong to this DPP."
            });
        }

        const question = await Question.findOne({
            _id: questionId,
            isActive: true
        }).lean();

        if (!question) {
            return res.status(404).json({
                message: "Question not found."
            });
        }

        if (
            question.questionType === "SINGLE_CORRECT" &&
            selectedOptions.length > 1
        ) {
            return res.status(400).json({
                message: "Select only one option for this question."
            });
        }

        const validKeys = new Set(
            (question.options || []).map((option) => option.key)
        );

        if (selectedOptions.some((key) => !validKeys.has(key))) {
            return res.status(400).json({
                message: "One or more selected options are invalid."
            });
        }

        const answerExists = attempt.answers.some((answer) => (
            String(answer.questionId) === String(questionId)
        ));

        if (!answerExists) {
            return res.status(400).json({
                message: "Answer slot not found."
            });
        }

        // Atomic update: cannot overwrite a concurrent FINALIZING/submission status.
        const updateResult = await Attempt.updateOne(
            {
                _id: attemptId,
                student: studentId,
                status: "IN_PROGRESS",
                "answers.questionId": questionId
            },
            {
                $set: {
                    "answers.$.selectedOptions": selectedOptions,
                    "answers.$.numericalAnswer": numericalAnswer,
                    "answers.$.markedForReview": Boolean(markedForReview),
                    "answers.$.visited": Boolean(visited)
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            const latestAttempt = await Attempt.findOne({
                _id: attemptId,
                student: studentId
            }).lean();

            if (!latestAttempt) {
                return res.status(404).json({
                    message: "Attempt not found."
                });
            }

            return res.status(409).json({
                message: latestAttempt.status === "FINALIZING"
                    ? "Your attempt is being finalized."
                    : "This attempt is no longer accepting answers.",
                status: latestAttempt.status
            });
        }

        return res.json({
            message: "Answer saved.",
            data: {
                questionId,
                saved: true,
                markedForReview: Boolean(markedForReview)
            }
        });
    } catch (error) {
        console.error("saveAnswer:", error);

        return res.status(500).json({
            message: "Unable to save answer."
        });
    }
};

// POST /students/dpps/attempts/:attemptId/submit
exports.submitAttempt = async (req, res) => {
    let claimedAttemptId = null;
    let studentId = null;

    try {
        studentId = req.student?._id;

        const { attemptId } = req.params;

        if (!studentId) {
            return res.status(401).json({
                message: "Student authentication required."
            });
        }

        if (!validId(attemptId)) {
            return res.status(400).json({
                message: "Invalid attempt ID."
            });
        }

        const existingAttempt = await Attempt.findOne({
            _id: attemptId,
            student: studentId
        });

        if (!existingAttempt) {
            return res.status(404).json({
                message: "Attempt not found."
            });
        }

        if (existingAttempt.status === "FINALIZING") {
            return res.status(409).json({
                message: "Your attempt is being finalized. Please try again shortly.",
                status: "FINALIZING"
            });
        }

        if (existingAttempt.status !== "IN_PROGRESS") {
            return res.json({
                message: "Attempt already submitted.",
                data: getAttemptSummary(existingAttempt)
            });
        }

        const dpp = await DPP.findById(existingAttempt.dpp).lean();

        if (!dpp) {
            return res.status(404).json({
                message: "DPP not found."
            });
        }

        // Atomic claim: only one request can begin grading this attempt.
        const attempt = await Attempt.findOneAndUpdate(
            {
                _id: attemptId,
                student: studentId,
                status: "IN_PROGRESS"
            },
            {
                $set: { status: "FINALIZING" }
            },
            {
                new: true
            }
        );

        if (!attempt) {
            const latestAttempt = await Attempt.findOne({
                _id: attemptId,
                student: studentId
            }).lean();

            if (!latestAttempt) {
                return res.status(404).json({
                    message: "Attempt not found."
                });
            }

            if (latestAttempt.status === "FINALIZING") {
                return res.status(409).json({
                    message: "Your attempt is being finalized. Please try again shortly.",
                    status: "FINALIZING"
                });
            }

            return res.json({
                message: "Attempt already submitted.",
                data: getAttemptSummary(latestAttempt)
            });
        }

        claimedAttemptId = attempt._id;

        const questionIds = getOrderedQuestionIds(dpp);

        const questions = await Question.find({
            _id: { $in: questionIds }
        }).lean();

        const questionById = new Map(
            questions.map((question) => [
                String(question._id),
                question
            ])
        );

        let score = 0;
        let maxScore = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let unansweredCount = 0;

        const topicMap = new Map();
        const review = [];

        for (const questionId of questionIds) {
            const question = questionById.get(String(questionId));

            if (!question) continue;

            maxScore += Number(question.marking?.correctMarks ?? 4);

            const answer = attempt.answers.find((item) => (
                String(item.questionId) === String(questionId)
            ));

            const graded = gradeQuestion(question, answer);

            score += graded.marks;

            if (!graded.attempted) {
                unansweredCount++;
            } else if (graded.isCorrect) {
                correctCount++;
            } else {
                incorrectCount++;
            }

            const tags = question.topicTags?.length
                ? question.topicTags
                : ["Untagged"];

            for (const tag of tags) {
                const item = topicMap.get(tag) || {
                    topic: tag,
                    total: 0,
                    correct: 0,
                    incorrect: 0,
                    marks: 0
                };

                item.total++;
                item.marks += graded.marks;

                if (graded.attempted) {
                    if (graded.isCorrect) {
                        item.correct++;
                    } else {
                        item.incorrect++;
                    }
                }

                topicMap.set(tag, item);
            }

            review.push({
                questionId: question._id,
                questionText: question.questionText,
                questionType: question.questionType,
                options: question.options,
                selectedOptions: answer?.selectedOptions || [],
                numericalAnswer: answer?.numericalAnswer ?? null,
                ...graded
            });
        }

        const submittedAt = new Date();
        const expired = isExpired(attempt, dpp, submittedAt.getTime());

        attempt.status = expired ? "AUTO_SUBMITTED" : "SUBMITTED";
        attempt.submittedAt = submittedAt;

        attempt.timeTakenSeconds = Math.max(
            0,
            Math.floor(
                (
                    submittedAt.getTime() -
                    new Date(attempt.startedAt).getTime()
                ) / 1000
            )
        );

        attempt.score = Number(score.toFixed(2));
        attempt.maxScore = Number(maxScore.toFixed(2));
        attempt.correctCount = correctCount;
        attempt.incorrectCount = incorrectCount;
        attempt.unansweredCount = unansweredCount;

        attempt.accuracy = correctCount + incorrectCount > 0
            ? Number(
                (
                    correctCount /
                    (correctCount + incorrectCount) *
                    100
                ).toFixed(2)
            )
            : 0;

        attempt.topicReport = [...topicMap.values()];

        await attempt.save();

        claimedAttemptId = null;

        return res.json({
            message: expired
                ? "Exam time expired. Your attempt was automatically submitted."
                : "DPP submitted successfully.",
            data: {
                attemptId: attempt._id,
                dppId: dpp._id,
                mode: attempt.mode,
                status: attempt.status,
                score: attempt.score,
                maxScore: attempt.maxScore,
                correctCount: attempt.correctCount,
                incorrectCount: attempt.incorrectCount,
                unansweredCount: attempt.unansweredCount,
                accuracy: attempt.accuracy,
                timeTakenSeconds: attempt.timeTakenSeconds,
                topicReport: attempt.topicReport,
                review: attempt.mode === "PRACTICE" ? review : undefined
            }
        });
    } catch (error) {
        console.error("submitAttempt:", error);

        // Release the claim only if this request still owns an unfinished attempt.
        if (claimedAttemptId && studentId) {
            try {
                await Attempt.updateOne(
                    {
                        _id: claimedAttemptId,
                        student: studentId,
                        status: "FINALIZING"
                    },
                    {
                        $set: { status: "IN_PROGRESS" }
                    }
                );
            } catch (recoveryError) {
                console.error(
                    "Failed to release attempt claim:",
                    recoveryError
                );
            }
        }

        return res.status(500).json({
            message: "Unable to submit attempt."
        });
    }
};

// GET /students/dpps/attempts/:attemptId
exports.getAttemptResult = async (req, res) => {
    try {
        const studentId = req.student?._id;
        const { attemptId } = req.params;

        if (!studentId) {
            return res.status(401).json({
                message: "Student authentication required."
            });
        }

        if (!validId(attemptId)) {
            return res.status(400).json({
                message: "Invalid attempt ID."
            });
        }

        const attempt = await Attempt.findOne({
            _id: attemptId,
            student: studentId
        })
            .populate("dpp", "title durationMinutes")
            .lean();

        if (!attempt) {
            return res.status(404).json({
                message: "Attempt not found."
            });
        }

        if (attempt.status === "FINALIZING") {
            return res.status(409).json({
                message: "Your result is being finalized. Please try again shortly.",
                status: "FINALIZING"
            });
        }

        if (attempt.status === "IN_PROGRESS") {
            return res.status(409).json({
                message: "Attempt has not been submitted."
            });
        }

        const data = {
            attemptId: attempt._id,
            dpp: attempt.dpp,
            mode: attempt.mode,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            timeTakenSeconds: attempt.timeTakenSeconds,
            score: attempt.score,
            maxScore: attempt.maxScore,
            correctCount: attempt.correctCount,
            incorrectCount: attempt.incorrectCount,
            unansweredCount: attempt.unansweredCount,
            accuracy: attempt.accuracy,
            topicReport: attempt.topicReport
        };

        if (attempt.mode === "PRACTICE") {
            const questions = await Question.find({
                _id: {
                    $in: attempt.answers.map((answer) => answer.questionId)
                }
            }).lean();

            const questionById = new Map(
                questions.map((question) => [
                    String(question._id),
                    question
                ])
            );

            data.review = attempt.answers
                .map((answer) => {
                    const question = questionById.get(
                        String(answer.questionId)
                    );

                    if (!question) return null;

                    return {
                        questionId: question._id,
                        questionText: question.questionText,
                        questionType: question.questionType,
                        options: question.options,
                        selectedOptions: answer.selectedOptions || [],
                        numericalAnswer: answer.numericalAnswer ?? null,
                        ...gradeQuestion(question, answer)
                    };
                })
                .filter(Boolean);
        }

        return res.json({ data });
    } catch (error) {
        console.error("getAttemptResult:", error);

        return res.status(500).json({
            message: "Unable to retrieve result."
        });
    }
};

// GET /students/dpps/attempts
exports.getMyAttempts = async (req, res) => {
    try {
        const studentId = req.student?._id;

        if (!studentId) {
            return res.status(401).json({
                message: "Student authentication required."
            });
        }

        const attempts = await Attempt.find({
            student: studentId,
            status: { $in: FINAL_STATUSES }
        })
            .populate("dpp", "title")
            .sort({ submittedAt: -1 })
            .lean();

        return res.json({
            count: attempts.length,
            data: attempts.map((attempt) => ({
                ...attempt,
                answers: sanitizeAnswers(attempt.answers || [])
            }))
        });
    } catch (error) {
        console.error("getMyAttempts:", error);

        return res.status(500).json({
            message: "Unable to retrieve attempts."
        });
    }
};
