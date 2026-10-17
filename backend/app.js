const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes.js');
const courseRoutes = require("./routes/course.routes.js");
const teacherRoutes=require("../backend/routes/teacher.routes.js")
const chapterRoutes = require("./routes/chapter.routes.js");
const lessonRoutes = require("./routes/lesson.routes.js");
//const subjectRoutes = require("./routes/subject.routes.js");
    const app=express();
    app.use(cors());
    app.use(cookieParser());
    app.use(express.json());
     

    app.use("/auth",authRoutes);
    app.use("/courses", courseRoutes);
    app.use("/subjects", courseRoutes);
    app.use("/teachers", teacherRoutes);
    app.use("/teachers/chapters", chapterRoutes);
    app.use("/teachers/lessons", lessonRoutes);
    module.exports=app;