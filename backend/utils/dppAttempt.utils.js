
const Attempt = require("../model/studentDppAttempt.model.js");
const DPP = require("../model/dpp.model.js");
const Question = require("../model/question.model.js");

function isExamExpired(attempt, dpp, now = Date.now()) {
  if (attempt.mode !== "EXAM") return false;

  const deadline =
    new Date(attempt.startedAt).getTime() +
    Number(dpp.durationMinutes) * 60 * 1000;

  return now >= deadline;
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
      isCorrect =
        Math.abs(Number(value) - Number(q.numericalAnswer)) <=
        Number(q.numericalTolerance || 0);

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
          const keys = [...new Set(r.selectedOptions || [])].sort();

          return keys.length === selected.length &&
            keys.every((key, i) => key === selected[i]);
        });

        marks = rule ? Number(rule.marks) : incorrectMarks;
      } else {
        marks = incorrectMarks;
      }
    }
  }

  return { attempted, isCorrect, marks };
}

async function finalizeExpiredAttempt(attemptId, now = new Date()) {
  // Claim an active attempt atomically so concurrent requests
  // cannot grade it twice.
  const attempt = await Attempt.findOne({
    _id: attemptId,
    status: "IN_PROGRESS",
    mode: "EXAM"
  });

  if (!attempt) return null;

  const dpp = await DPP.findById(attempt.dpp).lean();

  if (!dpp || !isExamExpired(attempt, dpp, now.getTime())) {
    return null;
  }

  const claimed = await Attempt.findOneAndUpdate(
    {
      _id: attempt._id,
      status: "IN_PROGRESS",
      mode: "EXAM"
    },
    { $set: { status: "FINALIZING" } },
    { new: true }
  );

  if (!claimed) return null;

  try {
    const questionIds = dpp.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(item => item.questionId);

    const questions = await Question.find({
      _id: { $in: questionIds }
    }).lean();

    const byId = new Map(questions.map(q => [String(q._id), q]));

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const topicMap = new Map();

    for (const id of questionIds) {
      const q = byId.get(String(id));
      if (!q) continue;

      maxScore += Number(q.marking?.correctMarks ?? 4);

      const answer = claimed.answers.find(
        a => String(a.questionId) === String(id)
      );

      const graded = gradeQuestion(q, answer);
      score += graded.marks;

      if (!graded.attempted) unansweredCount++;
      else if (graded.isCorrect) correctCount++;
      else incorrectCount++;

      const tags = q.topicTags?.length ? q.topicTags : ["Untagged"];

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

        if (graded.isCorrect) item.correct++;
        else item.incorrect++;

        topicMap.set(tag, item);
      }
    }

    claimed.score = Number(score.toFixed(2));
    claimed.maxScore = Number(maxScore.toFixed(2));
    claimed.correctCount = correctCount;
    claimed.incorrectCount = incorrectCount;
    claimed.unansweredCount = unansweredCount;

    claimed.accuracy = correctCount + incorrectCount > 0
      ? Number(
          (correctCount / (correctCount + incorrectCount) * 100).toFixed(2)
        )
      : 0;

    claimed.topicReport = [...topicMap.values()];
    claimed.submittedAt = now;
    claimed.timeTakenSeconds = Math.max(
      0,
      Math.floor((now.getTime() - claimed.startedAt.getTime()) / 1000)
    );
    claimed.status = "AUTO_SUBMITTED";

    await claimed.save();

    return claimed;
  } catch (error) {
    // Avoid permanently locking an attempt if grading fails.
    // A later expiry check can retry it.
    await Attempt.updateOne(
      { _id: claimed._id, status: "FINALIZING" },
      { $set: { status: "IN_PROGRESS" } }
    );

    throw error;
  }
}

module.exports = {
  isExamExpired,
  finalizeExpiredAttempt
};
