const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150
        },

        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000
        },

        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
            index: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
            index: true
        },

        order: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft"
        },

        isArchived: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

chapterSchema.index(
    { subjectId: 1, order: 1 },
    { unique: true }
);

module.exports = mongoose.model("Chapter", chapterSchema);