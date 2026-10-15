# Backend Module Guide

This guide maps major backend responsibilities to source files so developers
can locate behavior quickly.

| Module | Purpose and entry points | Dependencies and related routes/models |
|---|---|---|
| Application setup | `backend/server.js`, `backend/app.js` | Loads environment, starts Express and mounts routers |
| Database | `backend/db/db.js` | Mongoose connection from `MONGODB_URI` |
| Authentication routes | `backend/routes/auth.routes.js` | Maps auth endpoints to auth controller and role middleware |
| Authentication controller | `backend/controller/auth.controller.js`; exports registration, login, logout handlers | Uses Student/Teacher models, bcrypt, jsonwebtoken |
| Authentication middleware | `backend/middleware/auth.middleware.js`; exports `authStudentMiddleware`, `authTeacherMiddleware` | Reads token cookie, verifies JWT, loads account models |
| Course catalog | `backend/routes/course.routes.js`, `backend/controller/course.controller.js` | Reads Course model; public `/courses` routes |
| Subject catalog | `backend/controller/subject.controller.js` | Reads Subject and Course models; subject routes share course router |
| Teacher profile | `backend/routes/teacher.routes.js`, `backend/controller/teacher.controller.js` | Protected with teacher middleware; reads/updates Teacher model |
| Chapter API | `backend/routes/chapter.routes.js`, `backend/controller/chapter.controller.js` | Protected with teacher middleware; reads Chapter and Subject models |
| Account schemas | `backend/model/student.model.js`, `backend/model/teacher.model.js` | Mongoose account schemas |
| Catalog schemas | `backend/model/course.model.js`, `backend/model/subject.model.js` | Course-to-subject relationship |
| Chapter schema | `backend/model/chapter.model.js` | Subject and Teacher references |
| Class schema | `backend/model/class.model.js` | Teacher reference; no mounted class route/controller |
| Enrollment schema | `backend/model/enrollment.model.js` | Student and Course references; no mounted enrollment route/controller |
| Lesson schema placeholder | `backend/model/lesson.model.js` | Empty schema declaration only; no exported model or route usage |
| Seed data | `backend/seed/seedCourses.js` | Upserts course and subject catalog records |

## Key exported operations

### Authentication

`auth.controller.js` exports `resgisterStudent` (spelling as currently
implemented), `loginStudent`, `logoutStudent`, `resgisterTeacher`,
`loginTeacher`, and `logoutTeacher`. See [Authentication](./authentication.md).

### Course and subject catalog

- `course.controller.js`: `getAllCourses`, `getCoursesById`
- `subject.controller.js`: `getSubjectsByCourse`, `getSubjectById`

These handlers are read-only and serve active catalog records. See
[API reference](./api-reference.md#public-course-and-subject-catalog).

### Teacher and chapters

- `teacher.controller.js`: `getMyProfile`, `updateMyProfile`
- `chapter.controller.js`: `createChapter`, `getMyChapters`,
  `getChapterById`, `updateChapter`, `archiveChapter`

Chapter operations use the authenticated teacher as the ownership scope. See
[API reference](./api-reference.md#teacher-chapters).

## No separate service or validation packages

The current project tree contains no service directory, shared validation
module, or custom error-handler module. Controllers directly perform
validation and Mongoose queries.
