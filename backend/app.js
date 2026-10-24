const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes.js');
const dppRoutes = require("./routes/dpp.routes");
const courseRoutes = require("./routes/course.routes.js");
const teacherRoutes=require("../backend/routes/teacher.routes.js")
const chapterRoutes = require("./routes/chapter.routes.js");
const lessonRoutes = require("./routes/lesson.routes.js");
const uploadRoutes = require("./routes/upload.routes");
//const subjectRoutes = require("./routes/subject.routes.js");
    const app=express();
    app.use(cors());
    app.use(cookieParser());
    app.use(express.json());
     

    app.use("/auth",authRoutes);
    app.use("/courses", courseRoutes);
    app.use("/subjects", courseRoutes);
    //-------------TEACHER--------------
    app.use("/teachers", teacherRoutes);
    app.use("/teachers/chapters", chapterRoutes);
    app.use("/teachers/lessons", lessonRoutes);
    app.use("/teachers/dpps", dppRoutes);
    app.use("/teachers/uploads", uploadRoutes);
    module.exports=app;