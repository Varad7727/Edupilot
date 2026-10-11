const studentModel = require("../model/student.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//registeer student

const resgisterStudent = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const isAlreadyExist = await studentModel.findOne({ email: email })

    if (isAlreadyExist) {
        return res.status(400).json({
            message: "User already exists"
        })
    }

    //user not present hash pass and store in db

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await studentModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword
    })

    //generate jwt token

    const token = jwt.sign({
        id: user._id,
    },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    })
}

//login student

const loginStudent = async (req, res) => {
    const { email, password } = req.body

    const user = await studentModel.findOne({ email: email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    //token generation

    const token = jwt.sign({
        id: user._id
    },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )
    res.cookie("token", token)
    res.status(200).json({
        message: "User logged in successfully",
        user: {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        }
    })
}

//logout student

const logoutStudent = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        message: "User logged out successfully"
    });
}

module.exports = {
    resgisterStudent,
    loginStudent,
    logoutStudent
}
