
const studentModel = require("../model/student.model.js");
const teacherModel = require("../model/teacher.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Common cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000
};

// Register student
const resgisterStudent = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const isAlreadyExist = await studentModel.findOne({
            email: normalizedEmail
        });

        if (isAlreadyExist) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await studentModel.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "student"
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: "student"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d", algorithm: "HS256" }
        );

        res.cookie("token", token, cookieOptions);

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: "student"
            }
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(
                val => val.message
            );

            return res.status(400).json({
                message: "Validation Error",
                errors: messages
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        console.error("Student registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Login student
const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await studentModel.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: "student"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d", algorithm: "HS256" }
        );

        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
            message: "User logged in successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: "student"
            }
        });
    } catch (error) {
        console.error("Student login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Logout student
const logoutStudent = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    });

    return res.status(200).json({
        message: "User logged out successfully"
    });
};

// Register teacher
const resgisterTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const isAlreadyExist = await teacherModel.findOne({
            email: normalizedEmail
        });

        if (isAlreadyExist) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await teacherModel.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "teacher"
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: "teacher"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d", algorithm: "HS256" }
        );

        res.cookie("token", token, cookieOptions);

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: "teacher"
            }
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(
                val => val.message
            );

            return res.status(400).json({
                message: "Validation Error",
                errors: messages
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        console.error("Teacher registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Login teacher
const loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await teacherModel.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: "teacher"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d", algorithm: "HS256" }
        );

        res.cookie("token", token, cookieOptions);

        return res.status(200).json({
            message: "User logged in successfully",
            user: {
                _id: user._id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: "teacher"
            }
        });
    } catch (error) {
        console.error("Teacher login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Logout teacher
const logoutTeacher = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    });

    return res.status(200).json({
        message: "User logged out successfully"
    });
};

module.exports = {
    resgisterStudent,
    loginStudent,
    logoutStudent,
    resgisterTeacher,
    loginTeacher,
    logoutTeacher
};
