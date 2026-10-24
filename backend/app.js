const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const teacherRoutes = require("./routes/teacher.routes");
const chapterRoutes = require("./routes/chapter.routes");
const lessonRoutes = require("./routes/lesson.routes");
const dppRoutes = require("./routes/dpp.routes");
const questionRoutes = require("./routes/question.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);
app.use("/subjects", courseRoutes);

// Teacher-protected APIs
app.use("/teachers", teacherRoutes);
app.use("/teachers/chapters", chapterRoutes);
app.use("/teachers/lessons", lessonRoutes);
app.use("/teachers/questions", questionRoutes);
app.use("/teachers/dpps", dppRoutes);
app.use("/teachers/uploads", uploadRoutes);

module.exports = app;
