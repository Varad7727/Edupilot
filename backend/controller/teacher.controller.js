const teacherModel = require("../model/teacher.model.js");
const bcrypt = require("bcrypt");
const getMyProfile = async (req, res) => {
  try {
    //find teacher by id
    const teacher = await teacherModel.findById(req.teacher._id);

    if (!teacher) {
      return res.status(404).json({
        status: "failed",
        message: "Teacher not found.",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Teacher profile retrieved successfully.",
      data: teacher,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal server error.",
    });
  }
};

const updateMyProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (
            firstName === undefined &&
            lastName === undefined &&
            email === undefined &&
            password === undefined
        ) {
            return res.status(400).json({
                status: "failed",
                message: "At least one field is required to update profile."
            });
        }

        const updates = {};

        // First name validation
        if (firstName !== undefined) {
            if (
                typeof firstName !== "string" ||
                firstName.trim().length < 4
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "First name must contain at least 4 characters."
                });
            }

            updates.firstName = firstName.trim();
        }

        // Last name validation
        if (lastName !== undefined) {
            if (
                typeof lastName !== "string" ||
                lastName.trim().length < 2
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Last name must contain at least 4 characters."
                });
            }

            updates.lastName = lastName.trim();
        }

        // Email validation
        if (email !== undefined) {
            if (
                typeof email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Please provide a valid email address."
                });
            }

            updates.email = email.trim().toLowerCase();

            // Check whether another teacher uses this email
            const existingTeacher = await teacherModel.findOne({
                email: updates.email,
                _id: { $ne: req.teacher._id }
            });

            if (existingTeacher) {
                return res.status(409).json({
                    status: "failed",
                    message: "Email is already registered."
                });
            }
        }

        // Password validation
        if (password !== undefined) {
            if (
                typeof password !== "string" ||
                password.length < 8
            ) {
                return res.status(400).json({
                    status: "failed",
                    message: "Password must contain at least 8 characters."
                });
            }

            updates.password = await bcrypt.hash(password, 10);
        }

        // Update teacher in MongoDB
        const teacher = await teacherModel.findByIdAndUpdate(
            req.teacher._id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!teacher) {
            return res.status(404).json({
                status: "failed",
                message: "Teacher not found."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Teacher profile updated successfully.",
            data: teacher
        });

    } catch (error) {
        console.error("Update teacher profile error:", error);

        return res.status(500).json({
            status: "failed",
            message: "Internal server error."
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile
};

//$ne means “not equal to.”
//$eq	Equal to
// $ne	 Not equal to
// $gt	 Greater than
// $lt	 Less than
// $gte Greater than or equal to
// $lte Less than or equal to