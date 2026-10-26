
const mongoose = require("mongoose");

const studentDppAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    selectedOptions: {
      type: [String],
      default: []
    },
    numericalAnswer: {
      type: Number,
      default: null
    },
    markedForReview: {
      type: Boolean,
      default: false
    },
    visited: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const studentDppAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },
    dpp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DPP",
      required: true,
      index: true
    },
    mode: {
      type: String,
      enum: ["PRACTICE", "EXAM"],
      required: true
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"],
      default: "IN_PROGRESS",
      index: true
    },
    answers: {
      type: [studentDppAnswerSchema],
      default: []
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    timeTakenSeconds: {
      type: Number,
      default: 0
    },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    topicReport: {
      type: [{
        topic: String,
        total: Number,
        correct: Number,
        incorrect: Number,
        marks: Number
      }],
      default: []
    }
  },
  { timestamps: true }
);

studentDppAttemptSchema.index({ student: 1, dpp: 1, createdAt: -1 });

module.exports = mongoose.model(
  "StudentDppAttempt",
  studentDppAttemptSchema
);
