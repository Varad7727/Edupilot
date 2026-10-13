const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength:[4,"First name must be at least 4 characters long"],
    },
    lastName: {
        type: String,
        required: true,
        minlength:[2,"Last name must be at least 2 characters long"],
    },
    email: {
        type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
    },
    password: {
        type: String,
        required: true,
        minlength:[6,"Password must be at least 6 characters long"],
    },
    role: {
        type: String,
        default: "teacher",
        immutable: true
    }
},{timestamps: true});

const teacherModel = mongoose.model("Teacher", teacherSchema);
module.exports = teacherModel;
