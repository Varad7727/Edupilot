
const mongoose = require("mongoose");

// Each item connects a DPP to an existing Question document.
const dppQuestionSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true,
        },

        // Position of this question in the DPP.
        order: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false }
);

const dppSchema = new mongoose.Schema(
    {
        // Name displayed to students and teachers.
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000,
        },

        instructions: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000,
        },

        // Chapter this DPP belongs to.
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
            index: true,
        },

        // Ordered references to questions in the Question Bank.
        questions: {
            type: [dppQuestionSchema],
            default: [],
        },

        // Duration for timed Exam Mode, in minutes.
        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
            max: 600,
        },

        // Deadline determines on-time eligibility, not accessibility.
        deadline: {
            type: Date,
            required: true,
        },

        // Derived by the backend, never trusted from teacher input.
        totalMarks: {
            type: Number,
            default: 0,
            min: 0,
        },

        // How the teacher originally supplied the questions.
        creationMethod: {
            type: String,
            enum: ["MANUAL", "PDF", "IMAGE", "MIXED"],
            default: "MANUAL",
        },

        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
            index: true,
        },

        // Teacher who owns this DPP.
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
            index: true,
        },

        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent the same question from appearing twice and ensure
// question positions are unique within a DPP.
dppSchema.pre("validate", function () {
    const questionIds = this.questions.map(
        (item) => item.questionId?.toString()
    );

    if (new Set(questionIds).size !== questionIds.length) {
        this.invalidate(
            "questions",
            "A question cannot appear more than once in a DPP."
        );
    }

    const orders = this.questions.map((item) => item.order);

    if (new Set(orders).size !== orders.length) {
        this.invalidate(
            "questions",
            "Question order values must be unique."
        );
    }
});

dppSchema.index({ chapterId: 1, status: 1, deadline: 1 });
dppSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("DPP", dppSchema);
