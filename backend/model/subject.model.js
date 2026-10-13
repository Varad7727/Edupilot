
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    displayOrder: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// A subject code must be unique within its course.
subjectSchema.index(
  { courseId: 1, code: 1 },
  { unique: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
