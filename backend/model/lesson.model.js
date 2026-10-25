
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        type: {
            type: String,
            enum: ["pdf", "video", "image"],
            required: true,
        },

        url: {
            type: String,
            required: true,
            trim: true,
        },

        fileId: {
            type: String,
            required: true,
            trim: true,
        },

        filePath: {
            type: String,
            default: "",
            trim: true,
        },

        mimeType: {
            type: String,
            required: true,
            trim: true,
        },

        size: {
            type: Number,
            required: true,
            min: 1,
        },

        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const lessonSchema = new mongoose.Schema(
    {
        // Identity
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000
        },

        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
            index: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
            index: true
        },

        // Organization
        order: {
            type: Number,
            required: true,
            min: 1
        },

        estimatedDuration: {
            type: Number,
            default: 0,
            min: 0
        },

        difficulty: {
            type: String,
            enum: [
                "beginner",
                "intermediate",
                "advanced"
            ],
            default: "intermediate"
        },

        // Academic structure
        learningObjectives: {
            type: [String],
            default: []
        },

        topics: {
            type: [{
                type: String,
                trim: true,
                maxlength: 100
            }],
            default: []
        },

        tags: {
            type: [{
                type: String,
                trim: true,
                lowercase: true,
                maxlength: 50
            }],
            default: []
        },

        prerequisites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson"
        }],

        // Content organization
        contentVersion: {
            type: Number,
            default: 1,
            min: 1
        },

        // AI integration metadata
        aiContext: {
            language: {
                type: String,
                default: "en"
            },

            syllabus: {
                type: String,
                default: "JEE"
            },

            learningLevel: {
                type: String,
                enum: [
                    "foundation",
                    "jee-main",
                    "jee-advanced",
                    "mixed"
                ],
                default: "mixed"
            },

            // Optional taxonomy IDs from the
            // EduPilot academic taxonomy dataset.
            taxonomyNodeIds: [{
                type: String,
                trim: true
            }]
        },

        aiProcessing: {
            status: {
                type: String,
                enum: [
                    "not_started",
                    "pending",
                    "processing",
                    "completed",
                    "failed",
                    "stale"
                ],
                default: "not_started"
            },

            indexedVersion: {
                type: Number,
                default: 0,
                min: 0
            },

            lastProcessedAt: {
                type: Date,
                default: null
            },

            lastError: {
                type: String,
                default: null,
                maxlength: 1000
            }
        },

        // Publication
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
            index: true
        },

        publishedAt: {
            type: Date,
            default: null
        },

        isArchived: {
            type: Boolean,
            default: false,
            index: true
        },
        resources: {
            type: [resourceSchema],
            default: [],
        },
    },
    {
        timestamps: true
    }
);

// Unique lesson position within a chapter.
lessonSchema.index(
    { chapterId: 1, order: 1 },
    { unique: true }
);

// Teacher lesson dashboard.
lessonSchema.index({
    createdBy: 1,
    chapterId: 1,
    isArchived: 1,
    order: 1
});

// Topic-based lesson discovery.
lessonSchema.index({
    topics: 1,
    status: 1
});

module.exports = mongoose.model("Lesson", lessonSchema);
