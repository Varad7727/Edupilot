
const mongoose = require("mongoose");
const Attempt = require("../model/studentDppAttempt.model.js");
const DPP = require("../model/dpp.model.js");
const Question = require("../model/question.model.js");
const Enrollment = require("../model/enrollment.model.js");
const Chapter = require("../model/chapter.model.js");
const Subject = require("../model/subject.model.js");

const validId = id => mongoose.isValidObjectId(id);

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

  const enrollment = await Enrollment.findOne({
    student: studentId,
    status: "active"
  }).populate({
    path: "course",
    match: { isActive: true },
    select: "_id"
  }).lean();

  // A student may have multiple enrollments.
  const enrollments = await Enrollment.find({
    student: studentId,
    status: "active"
  }).populate({
    path: "course",
    match: { isActive: true },
    select: "_id"
  }).lean();

  const enrolled = enrollments.some(e =>
    e.course && String(e.course._id) === String(subject.courseId)
  );

  return enrolled ? dpp : null;
}

function publicQuestion(q, index) {
  return {
    questionId: q._id,
    number: index + 1,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    image: q.image,
    difficulty: q.difficulty,
    topicTags: q.topicTags || [],
    marks: q.marking?.correctMarks ?? 4,
    negativeMarks: q.marking?.incorrectMarks ?? -1
  };
}

function sanitizeAnswers(answers) {
  return answers.map(a => ({
    questionId: a.questionId,
    selectedOptions: a.selectedOptions || [],
    numericalAnswer: a.numericalAnswer ?? null,
    markedForReview: Boolean(a.markedForReview),
    visited: Boolean(a.visited)
  }));
}

function gradeQuestion(q, answer) {
  const selected = [...new Set(answer?.selectedOptions || [])].sort();
  const correct = [...new Set(q.correctOptions || [])].sort();
  const marking = q.marking || {};
  const correctMarks = Number(marking.correctMarks ?? 4);
  const incorrectMarks = Number(marking.incorrectMarks ?? -1);
  const unattemptedMarks = Number(marking.unattemptedMarks ?? 0);

  let attempted = false;
  let isCorrect = false;
  let marks = unattemptedMarks;

  if (q.questionType === "NUMERICAL") {
    const value = answer?.numericalAnswer;
    attempted = value !== null && value !== undefined && value !== "";

    if (attempted && Number.isFinite(Number(value))) {
      const expected = Number(q.numericalAnswer);
      const tolerance = Number(q.numericalTolerance || 0);
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
        selected.every((key, i) => key === correct[i]);

      if (isCorrect) {
        marks = correctMarks;
      } else if (q.questionType === "MULTIPLE_CORRECT") {
        const rule = (marking.partialMarkingRules || []).find(r => {
          const ruleKeys = [...new Set(r.selectedOptions || [])].sort();
          return ruleKeys.length === selected.length &&
            ruleKeys.every((key, i) => key === selected[i]);
        });

        marks = rule ? Number(rule.marks) : incorrectMarks;
      } else {
        marks = incorrectMarks;
      }
    }
  }

  return {
    attempted,
    isCorrect,
    marks,
    correctAnswer: q.questionType === "NUMERICAL"
      ? q.numericalAnswer
      : correct,
    explanation: q.explanation || ""
  };
}

function isExpired(attempt, dpp) {
  if (attempt.mode !== "EXAM") return false;
  return Date.now() >=
    new Date(attempt.startedAt).getTime() +
    dpp.durationMinutes * 60 * 1000;
}

// POST /students/dpps/:dppId/attempts
exports.startAttempt = async (req, res) => {
  try {
    const studentId = req.student?._id;
    const { dppId } = req.params;
    const mode = String(req.body?.mode || "").toUpperCase();

    if (!studentId) {
      return res.status(401).json({ message: "Student authentication required." });
    }
    if (!validId(dppId) || !["PRACTICE", "EXAM"].includes(mode)) {
      return res.status(400).json({ message: "Valid DPP ID and mode are required." });
    }

    const dpp = await getAccessibleDpp(studentId, dppId);
    if (!dpp) {
      return res.status(404).json({ message: "DPP not found or not accessible." });
    }

    const questionIds = dpp.questions
      .sort((a, b) => a.order - b.order)
      .map(item => item.questionId);

    if (!questionIds.length) {
      return res.status(400).json({ message: "This DPP has no questions." });
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
      isActive: true
    }).lean();

    const questionById = new Map(questions.map(q => [String(q._id), q]));
    const orderedQuestions = questionIds
      .map(id => questionById.get(String(id)))
      .filter(Boolean);

    if (!orderedQuestions.length) {
      return res.status(400).json({ message: "No active questions are available." });
    }

    const attempt = await Attempt.create({
      student: studentId,
      dpp: dpp._id,
      mode,
      maxScore: orderedQuestions.reduce(
        (sum, q) => sum + Number(q.marking?.correctMarks ?? 4), 0
      ),
      answers: orderedQuestions.map(q => ({ questionId: q._id }))
    });

    return res.status(201).json({
      message: "Attempt started.",
      data: {
        attemptId: attempt._id,
        mode,
        startedAt: attempt.startedAt,
        durationMinutes: mode === "EXAM" ? dpp.durationMinutes : null,
        deadline: mode === "EXAM"
          ? new Date(attempt.startedAt.getTime() + dpp.durationMinutes * 60000)
          : null,
        questions: orderedQuestions.map(publicQuestion)
      }
    });
  } catch (error) {
    console.error("startAttempt:", error);
    return res.status(500).json({ message: "Unable to start attempt." });
  }
};

// PATCH /students/dpps/attempts/:attemptId/answers
exports.saveAnswer = async (req, res) => {
  try {
    const studentId = req.student?._id;
    const { attemptId } = req.params;
    const { questionId, selectedOptions = [], numericalAnswer = null,
      markedForReview = false, visited = true } = req.body || {};

    if (!validId(attemptId) || !validId(questionId)) {
      return res.status(400).json({ message: "Invalid attempt or question ID." });
    }
    if (!Array.isArray(selectedOptions) ||
        !selectedOptions.every(v => typeof v === "string")) {
      return res.status(400).json({ message: "selectedOptions must be an array of strings." });
    }
    if (numericalAnswer !== null &&
        (typeof numericalAnswer !== "number" || !Number.isFinite(numericalAnswer))) {
      return res.status(400).json({ message: "numericalAnswer must be a finite number or null." });
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      student: studentId,
      status: "IN_PROGRESS"
    });
    if (!attempt) {
      return res.status(404).json({ message: "Active attempt not found." });
    }

    const dpp = await DPP.findById(attempt.dpp).lean();
    if (!dpp) return res.status(404).json({ message: "DPP not found." });

    if (isExpired(attempt, dpp)) {
      return res.status(409).json({
        message: "Exam time expired. Submit the attempt to finalize your result.",
        expired: true
      });
    }

    const inDpp = dpp.questions.some(item =>
      String(item.questionId) === String(questionId)
    );
    if (!inDpp) {
      return res.status(400).json({ message: "Question does not belong to this DPP." });
    }

    const question = await Question.findOne({
      _id: questionId,
      isActive: true
    }).lean();
    if (!question) return res.status(404).json({ message: "Question not found." });

    if (question.questionType === "SINGLE_CORRECT" && selectedOptions.length > 1) {
      return res.status(400).json({ message: "Select only one option for this question." });
    }

    const validKeys = new Set((question.options || []).map(o => o.key));
    if (selectedOptions.some(key => !validKeys.has(key))) {
      return res.status(400).json({ message: "One or more selected options are invalid." });
    }

    const answer = attempt.answers.find(a =>
      String(a.questionId) === String(questionId)
    );
    if (!answer) return res.status(400).json({ message: "Answer slot not found." });

    answer.selectedOptions = selectedOptions;
    answer.numericalAnswer = numericalAnswer;
    answer.markedForReview = Boolean(markedForReview);
    answer.visited = Boolean(visited);
    await attempt.save();

    return res.json({
      message: "Answer saved.",
      data: {
        questionId,
        saved: true,
        markedForReview: answer.markedForReview
      }
    });
  } catch (error) {
    console.error("saveAnswer:", error);
    return res.status(500).json({ message: "Unable to save answer." });
  }
};

// POST /students/dpps/attempts/:attemptId/submit
exports.submitAttempt = async (req, res) => {
  try {
    const studentId = req.student?._id;
    const { attemptId } = req.params;

    if (!validId(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID." });
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      student: studentId
    });
    if (!attempt) return res.status(404).json({ message: "Attempt not found." });

    if (attempt.status !== "IN_PROGRESS") {
      return res.json({
        message: "Attempt already submitted.",
        data: {
          attemptId: attempt._id,
          status: attempt.status,
          score: attempt.score,
          maxScore: attempt.maxScore,
          correctCount: attempt.correctCount,
          incorrectCount: attempt.incorrectCount,
          unansweredCount: attempt.unansweredCount,
          accuracy: attempt.accuracy
        }
      });
    }

    const dpp = await DPP.findById(attempt.dpp).lean();
    if (!dpp) return res.status(404).json({ message: "DPP not found." });

    const questionIds = dpp.questions
      .sort((a, b) => a.order - b.order)
      .map(item => item.questionId);

    const questions = await Question.find({
      _id: { $in: questionIds }
    }).lean();
    const questionById = new Map(questions.map(q => [String(q._id), q]));

    let score = 0, correctCount = 0, incorrectCount = 0, unansweredCount = 0;
    let maxScore = 0;
    const topicMap = new Map();
    const review = [];

    for (const id of questionIds) {
      const q = questionById.get(String(id));
      if (!q) continue;

      maxScore += Number(q.marking?.correctMarks ?? 4);
      const answer = attempt.answers.find(a => String(a.questionId) === String(id));
      const graded = gradeQuestion(q, answer);

      score += graded.marks;
      if (!graded.attempted) unansweredCount++;
      else if (graded.isCorrect) correctCount++;
      else incorrectCount++;

      for (const tag of (q.topicTags?.length ? q.topicTags : ["Untagged"])) {
        const item = topicMap.get(tag) || {
          topic: tag, total: 0, correct: 0, incorrect: 0, marks: 0
        };
        item.total++;
        item.marks += graded.marks;
        if (!graded.attempted || !graded.isCorrect) item.incorrect++;
        if (graded.isCorrect) item.correct++;
        topicMap.set(tag, item);
      }

      review.push({
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        selectedOptions: answer?.selectedOptions || [],
        numericalAnswer: answer?.numericalAnswer ?? null,
        ...graded
      });
    }

    const now = new Date();
    const expired = isExpired(attempt, dpp);
    attempt.status = expired ? "AUTO_SUBMITTED" : "SUBMITTED";
    attempt.submittedAt = now;
    attempt.timeTakenSeconds = Math.max(
      0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)
    );
    attempt.score = Number(score.toFixed(2));
    attempt.maxScore = Number(maxScore.toFixed(2));
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.accuracy = (correctCount + incorrectCount) > 0
      ? Number((correctCount / (correctCount + incorrectCount) * 100).toFixed(2))
      : 0;
    attempt.topicReport = [...topicMap.values()];
    await attempt.save();

    return res.json({
      message: "DPP submitted successfully.",
      data: {
        attemptId: attempt._id,
        dppId: dpp._id,
        mode: attempt.mode,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracy: attempt.accuracy,
        timeTakenSeconds: attempt.timeTakenSeconds,
        topicReport: attempt.topicReport,
        review: attempt.mode === "PRACTICE" ? review : undefined
      }
    });
  } catch (error) {
    console.error("submitAttempt:", error);
    return res.status(500).json({ message: "Unable to submit attempt." });
  }
};

// GET /students/dpps/attempts/:attemptId
exports.getAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    if (!validId(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID." });
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      student: req.student?._id
    }).populate("dpp", "title durationMinutes").lean();

    if (!attempt) return res.status(404).json({ message: "Attempt not found." });
    if (attempt.status === "IN_PROGRESS") {
      return res.status(409).json({ message: "Attempt has not been submitted." });
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
        _id: { $in: attempt.answers.map(a => a.questionId) }
      }).lean();

      data.review = attempt.answers.map(answer => {
        const q = questions.find(x => String(x._id) === String(answer.questionId));
        if (!q) return null;
        return {
          questionId: q._id,
          questionText: q.questionText,
          options: q.options,
          selectedOptions: answer.selectedOptions,
          numericalAnswer: answer.numericalAnswer,
          ...gradeQuestion(q, answer)
        };
      }).filter(Boolean);
    }

    return res.json({ data });
  } catch (error) {
    console.error("getAttemptResult:", error);
    return res.status(500).json({ message: "Unable to retrieve result." });
  }
};

// GET /students/dpps/attempts
exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({
      student: req.student?._id,
      status: { $ne: "IN_PROGRESS" }
    })
      .populate("dpp", "title")
      .sort({ submittedAt: -1 })
      .lean();

    return res.json({ count: attempts.length, data: attempts });
  } catch (error) {
    console.error("getMyAttempts:", error);
    return res.status(500).json({ message: "Unable to retrieve attempts." });
  }
};
