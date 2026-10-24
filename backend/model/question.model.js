const mongoose = require('mongoose')


//answer options
//key
// This is a stable identifier for the option, such as "A", "B", "C", or "D"
const optionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true
        },
        // Stable identifier for answer options
        key: {
            type: String,
            required: true,
            trim: true
        },
    },
    { _id: false }
)

const partialMarkingRuleSchema = new mongoose.Schema({
    selectedOptions: {
        type: [String],
        required: true,
    },
    marks: {
        type: Number,
        required: true
    }
}, { _id: false })

//markingscheme
const questionImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    fileId: {
        type: String,
        trim: true,
        default: "",
    },
    filePath: {
        type: String,
        trim: true,
        default: "",
    },
    altText: {
        type: String,
        trim: true,
        maxlength: 250,
        default: "",
    },
}, { _id: false });

const markingSchema = new mongoose.Schema({
    correctMarks: {
        type: Number,
        required: true,
        default: 4,
    },
    incorrectMarks: {
        type: Number,
        required: true,
        default: -1,
    },
    unattemptedMarks: {
        type: Number,
        required: true,
        default: 0,
    },
    partialMarkingRules: {
        type: [partialMarkingRuleSchema],
        default: [],
    },
}, { _id: false })

//questionschema
const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true,
    },
    questionType: {
        type: String,
        enum: ["SINGLE_CORRECT", "MULTIPLE_CORRECT",
            "NUMERICAL",],
        required: true,
    },
    options: {
        type: [optionSchema],
        default: [],
    },
    // Used for MCQ question types
    correctOptions: {
        type: [String],
        default: [],
    },
    // Used for numerical questions
    numericalAnswer: {
        type: Number,
    },
    // Optional tolerance for numerical answers
    numericalTolerance: {
        type: Number,
        default: 0,
        min: 0,
    },

    explanation: {
        type: String,
        trim: true,
        default: "",
    },

    // Optional diagram/image attached to the question.
    image: {
        type: questionImageSchema,
        default: undefined,
    },

    difficulty: {
        type: String,
        enum: ["EASY", "MEDIUM", "HARD"],
        required: true,
    },

    subject: {
        type: String,
        enum: ["PHYSICS", "CHEMISTRY", "MATHEMATICS"],
        required: true,
    },

    chapterId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chapter",
        required:true,
        index:true,
    },
    
     topicTags: {
        type: [String],
        default: [],
    },

    marking: {
        type: markingSchema,
        required: true,
        default: () => ({}),
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
    },
       isActive: {
        type: Boolean,
        default: true,
    },


},{timestamps:true})

questionSchema.index({
chapterId: 1,
questionType: 1,
difficulty: 1,
});

module.exports = mongoose.model("Question", questionSchema);