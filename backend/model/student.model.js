const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
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
        default: "student",
        immutable: true
    }
},{timestamps: true});

const studentModel = mongoose.model("Student", studentSchema);
module.exports = studentModel;
