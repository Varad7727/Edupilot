
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const teacherRoutes = require("./routes/teacher.routes");
const chapterRoutes = require("./routes/chapter.routes");
const lessonRoutes = require("./routes/lesson.routes");
const dppRoutes = require("./routes/dpp.routes");
const uploadRoutes = require("./routes/upload.routes");

const studentDPPRoutes = require("./routes/student.dpp.routes.js");
const studentRoutes = require("./routes/student.routes.js");
const studentLessonRoutes = require("./routes/student.lesson.routes.js");
const studentChapterRoutes = require("./routes/student.chapter.routes.js");
const studentDppAttemptRoutes = require(
  "./routes/student.dppAttempt.routes.js"
);

const app = express();

// Global middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // Allow localhost or 127.0.0.1 on any port for development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Authentication
app.use("/auth", authRoutes);

// Courses and subjects
app.use("/courses", courseRoutes);
app.use("/subjects", courseRoutes);

// Teacher APIs
app.use("/teachers", teacherRoutes);
app.use("/teachers/chapters", chapterRoutes);
app.use("/teachers/lessons", lessonRoutes);
app.use("/teachers/dpps", dppRoutes);
app.use("/teachers/uploads", uploadRoutes);

// Student APIs
app.use("/students", studentRoutes);
app.use("/students/chapters", studentChapterRoutes);
app.use("/students/lessons", studentLessonRoutes);

// Student DPP listing and attempt management
app.use("/students/dpps", studentDPPRoutes);
app.use("/students/dpps", studentDppAttemptRoutes);

module.exports = app;
