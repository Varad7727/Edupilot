# API Reference

All routes below are mounted by `backend/app.js`. The server currently listens
on `http://localhost:3000`. JSON request bodies require
`Content-Type: application/json`. Protected routes use the `token` HTTP-only
cookie, not a documented bearer-token header.

## Contents

- [Authentication](#authentication)
- [Public course and subject catalog](#public-course-and-subject-catalog)
- [Teacher profile](#teacher-profile)
- [Teacher chapters](#teacher-chapters)
- [Teacher lessons](#teacher-lessons)
- [Response conventions and caveats](#response-conventions-and-caveats)

## Authentication

Routes are registered in `backend/routes/auth.routes.js` and implemented in
`backend/controller/auth.controller.js`. Registration and login are public;
logout requires the corresponding role's authentication middleware.

| Method | Exact route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/student/register` | No | Create a student and log them in |
| POST | `/auth/student/login` | No | Log in a student |
| POST | `/auth/student/logout` | Student | Clear the token cookie |
| POST | `/auth/teacher/register` | No | Create a teacher and log them in |
| POST | `/auth/teacher/login` | No | Log in a teacher |
| POST | `/auth/teacher/logout` | Teacher | Clear the token cookie |

Registration requires string `firstName`, `lastName`, `email`, and `password`
values; none may be empty after trimming (password is checked as a non-empty
string but not trimmed). Email is lowercased and trimmed. Passwords are
bcrypt-hashed with cost factor 10 before storage. Model validation additionally
requires first names of at least 4 characters, last names of at least 2, and
passwords of at least 6. The registration controller does not perform a
separate email-format check.

Login requires non-empty string `email` and `password`. The password is
verified with `bcrypt.compare`. Missing fields return `400`; incorrect email
or password also returns `400` with a generic message.

Example teacher login:

```http
POST /auth/teacher/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "example-password"
}
```

The same fields are used for student registration/login, with the corresponding
student endpoint path.

Successful registration (`201`) returns the following shape and sets the
`token` cookie:

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "64f1c5d2b7b4a1234567890b",
    "email": "teacher@example.com",
    "name": "Alice Smith",
    "role": "teacher"
  }
}
```

Successful login (`200`) returns the same `user` fields with
`"User logged in successfully"` as the message. Student responses use
`"role": "student"`.

Validation and duplicate-key registration errors return `400`; unexpected
registration or login errors return `500`.

Logout returns `200` with `{"message":"User logged out successfully"}` and
clears the cookie. It does not implement server-side token revocation.

Example logout call, with a token cookie saved by the prior login:

```bash
curl -i -X POST http://localhost:3000/auth/teacher/logout -b cookies.txt
```

**Current student logout caveat:** student registration/login issue JWTs with
role `"student"`, while the student middleware requires `"Student"`. As a
result, a token issued by these endpoints is rejected with `403` at
`POST /auth/student/logout`. Teacher role casing matches.

See [Authentication](./authentication.md) for cookie options, JWT contents,
middleware behavior, and limitations.

## Public course and subject catalog

Routes are registered in `backend/routes/course.routes.js`; the router is
mounted at both `/courses` and `/subjects`.

| Method | Exact route | Auth | Purpose |
|---|---|---|---|
| GET | `/courses` | No | List active courses |
| GET | `/courses/:courseId` | No | Retrieve one active course |
| GET | `/courses/:courseId/subjects` | No | List active subjects for an active course |
| GET | `/courses/subjects/:subjectId` | No | Retrieve one active subject and its course |

The router's second mount at `/subjects` creates aliases. For example,
`GET /subjects` lists courses and `GET /subjects/subjects/:subjectId` retrieves
a subject. Use the `/courses/...` routes above as the clearer canonical paths.

### `GET /courses`

Returns `200`:

```json
{
  "message": "Courses retrieved successfully.",
  "status": "success",
  "data": [
    {
      "_id": "64f1c5d2b7b4a1234567890a",
      "name": "JEE Class 11",
      "code": "JEE-11",
      "description": "JEE preparation course for Class 11",
      "classLevel": 11
    }
  ]
}
```

Only active courses are returned, with selected fields, sorted by
`classLevel` ascending. Database failure returns `500`.

### `GET /courses/:courseId`

Requires a valid MongoDB ObjectId in `courseId`. Returns `200` with
`{"status":"success","data":{...}}`; only active courses are visible. Invalid
ID returns `400`; missing/inactive course returns `404`; database failure
returns `500`.

### `GET /courses/:courseId/subjects`

Requires a valid course ObjectId and an existing active course. Returns
`200` with `status`, `count`, and `subject` (an array containing
`name`, `code`, `description`, `displayOrder`, and `courseId`, plus `_id`).
Subjects are filtered to active and sorted by `displayOrder` ascending.
Invalid course ID returns `400`; missing/inactive course returns `404`;
database failure returns `500`.

### `GET /courses/subjects/:subjectId`

Requires a valid subject ObjectId. Returns `200` with `status` and `subject`;
the subject's `courseId` is populated with the course's `name`, `code`, and
`classLevel`. Only active subjects are returned. Invalid ID returns `400`;
missing/inactive subject returns `404`; database failure returns `500`.

## Teacher profile

Routes are registered in `backend/routes/teacher.routes.js`. Both require the
teacher role.

| Method | Exact route | Purpose |
|---|---|---|
| GET | `/teachers/me` | Retrieve the authenticated teacher |
| PATCH | `/teachers/update` | Update teacher profile fields |

### `GET /teachers/me`

Returns `200` with a success message and the teacher document in `data`.
Current implementation returns the full Mongoose document and does not exclude
the password field. The stored value should be a bcrypt hash, but this route
still exposes it; treat this endpoint/response as sensitive. Missing teacher
returns `404`; internal failure returns `500`.

### `PATCH /teachers/update`

The JSON body must include at least one supported field:

| Field | Current validation |
|---|---|
| `firstName` | String, at least 4 characters after trimming |
| `lastName` | String, at least 2 characters after trimming |
| `email` | Valid email-shaped string; trimmed/lowercased; must not belong to another teacher |
| `password` | String of at least 8 characters; bcrypt-hashed before saving |

Unsupported properties are not copied to the update object. Success returns
`200`, a message, and teacher data with `password` excluded. Invalid body or
field returns `400`; email conflict returns `409`; missing teacher returns
`404`; unexpected database/update failure returns `500`.

## Teacher chapters

All chapter routes require a teacher token. They are registered in
`backend/routes/chapter.routes.js`, mounted at `/teachers/chapters`, and
implemented by `backend/controller/chapter.controller.js`.

| Method | Exact route | Purpose |
|---|---|---|
| POST | `/teachers/chapters` | Create a chapter |
| GET | `/teachers/chapters` | List current teacher's non-archived chapters |
| GET | `/teachers/chapters/:chapterId` | Retrieve one owned non-archived chapter |
| PATCH | `/teachers/chapters/:chapterId` | Update an owned non-archived chapter |
| DELETE | `/teachers/chapters/:chapterId` | Soft archive an owned chapter |

### `POST /teachers/chapters`

Required JSON fields: `title` (string, trimmed length 2–150), `subjectId`
(valid ObjectId for an active subject), and `order` (positive integer).
Optional `description` must be a string of at most 2,000 characters. The
server sets `createdBy` from the authenticated teacher; clients cannot assign
the creator through the request body.

Success is `201`:

```json
{
  "status": "success",
  "message": "Chapter created successfully.",
  "data": {
    "_id": "64f1c5d2b7b4a1234567890f",
    "title": "Kinematics",
    "description": "Motion fundamentals",
    "subjectId": "64f1c5d2b7b4a1234567890d",
    "createdBy": "64f1c5d2b7b4a1234567890b",
    "order": 1,
    "status": "draft",
    "isArchived": false
  }
}
```

Invalid/missing request fields or malformed subject ID return `400`; missing
or inactive subject returns `404`; unexpected errors (including an
unhandled unique-index collision) return `500`.

### `GET /teachers/chapters` and `GET /teachers/chapters/:chapterId`

The list returns `200` with `status`, `count`, and `data`; the item route
returns `200` with `status` and `data`. Both filter by authenticated teacher
and `isArchived: false`. List order is ascending by `order`. `subjectId` is
populated with the subject's `name`, `code`, and `courseId`. An invalid item
ID returns `400`; a missing, archived, or non-owned chapter returns `404`;
database failure returns `500`.

### `PATCH /teachers/chapters/:chapterId`

The intended accepted properties are `title`, `description`, `order`, and
`status` (`draft` or `published`). The chapter is filtered by ID, owner, and
`isArchived: false`. Success returns `200` with the updated chapter.

**Important: current runtime behavior differs from the intended optional
field contract.** The current `if (!order !== undefined)` check always runs
order validation; therefore `order` must be supplied as a positive integer
even when changing another field. The description validation calls
`description.length()` and checks the type of `title` instead of
`description`. Sending `description` therefore throws and is caught as `500`.
Until the implementation is fixed, send `order` and do not send `description`.
Invalid chapter ID and body/field validation return `400`; a chapter that is
missing, archived, or not owned by the teacher returns `404`.

Example of a currently supported update:

```http
PATCH /teachers/chapters/64f1c5d2b7b4a1234567890f
Content-Type: application/json
Cookie: token=<obtained-by-login>

{"order":1,"status":"published"}
```

### `DELETE /teachers/chapters/:chapterId`

Sets `isArchived` to `true`; it does not delete the document. Success returns
`200` with the archived chapter. Invalid ID returns `400`; missing, already
archived, or non-owned chapter returns `404`; database failure returns `500`.
Archived chapters are excluded from teacher list and item reads.

## Teacher lessons

All lesson routes require a teacher token. They are registered in
`backend/routes/lesson.routes.js`, mounted at `/teachers/lessons`, and
implemented by `backend/controller/lesson.controller.js`.

| Method | Exact route | Purpose |
|---|---|---|
| POST | `/teachers/lessons` | Create a lesson inside an owned chapter |
| GET | `/teachers/lessons` | List the current teacher's non-archived lessons |
| GET | `/teachers/lessons/chapter/:chapterId` | List lessons inside one owned chapter |
| GET | `/teachers/lessons/:lessonId` | Retrieve one owned lesson |
| PATCH | `/teachers/lessons/:lessonId` | Update supported lesson metadata |
| PATCH | `/teachers/lessons/:lessonId/publish` | Publish a lesson |
| PATCH | `/teachers/lessons/:lessonId/unpublish` | Move the lesson back to `draft` |
| DELETE | `/teachers/lessons/:lessonId` | Soft archive a lesson |

### Supported lesson fields

The create and update flows accept these fields when present:

- `title`: 3–150 characters after trim
- `description`: string; maximum 2,000 characters
- `chapterId`: valid Mongo ObjectId for an owned chapter
- `order`: positive integer unique within the chapter
- `estimatedDuration`: non-negative number
- `difficulty`: `beginner`, `intermediate`, or `advanced`
- `learningObjectives`: array of strings
- `topics`: array of strings
- `tags`: array of strings
- `prerequisites`: array of valid Lesson ObjectIds belonging to the same teacher
- `aiContext`: object containing `language`, `syllabus`, `learningLevel`, and optional `taxonomyNodeIds`

The current controller uses a fixed `editableFields` allowlist and rejects any
other property names.

### `POST /teachers/lessons`

Required request data includes `title`, `description`, `chapterId`, and
`order`. The route verifies that the chapter exists, belongs to the logged-in
teacher, and is not archived.

Example request:

```http
POST /teachers/lessons
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "title": "Newton's Laws of Motion",
  "description": "Introduces force, inertia, and acceleration in mechanics.",
  "chapterId": "64f1c5d2b7b4a1234567890f",
  "order": 2,
  "estimatedDuration": 35,
  "difficulty": "beginner",
  "learningObjectives": [
    "Define force",
    "Explain inertia",
    "Connect acceleration to net force"
  ],
  "topics": ["Mechanics", "Forces"],
  "tags": ["jee", "physics"],
  "prerequisites": ["64f1c5d2b7b4a1234567890e"],
  "aiContext": {
    "language": "en",
    "syllabus": "JEE",
    "learningLevel": "jee-main",
    "taxonomyNodeIds": ["phy-force-01", "phy-motion-02"]
  }
}
```

On success, the API responds with `201` and a lesson object similar to:

```json
{
  "status": "success",
  "message": "Lesson created successfully.",
  "data": {
    "_id": "64f1c5d2b7b4a12345678911",
    "title": "Newton's Laws of Motion",
    "description": "Introduces force, inertia, and acceleration in mechanics.",
    "chapterId": "64f1c5d2b7b4a1234567890f",
    "createdBy": "64f1c5d2b7b4a1234567890b",
    "order": 2,
    "estimatedDuration": 35,
    "difficulty": "beginner",
    "learningObjectives": [
      "Define force",
      "Explain inertia",
      "Connect acceleration to net force"
    ],
    "topics": ["Mechanics", "Forces"],
    "tags": ["jee", "physics"],
    "prerequisites": ["64f1c5d2b7b4a1234567890e"],
    "status": "draft",
    "aiContext": {
      "language": "en",
      "syllabus": "JEE",
      "learningLevel": "jee-main",
      "taxonomyNodeIds": ["phy-force-01", "phy-motion-02"]
    },
    "isArchived": false,
    "contentVersion": 1,
    "aiProcessing": {
      "status": "not_started",
      "indexedVersion": 0,
      "lastProcessedAt": null,
      "lastError": null
    }
  }
}
```

Invalid chapter IDs, invalid order values, duplicate lesson orders, or
missing/invalid prerequisite lesson IDs return `400`. Non-owned or missing
chapters return `404`; duplicate-order MongoDB errors are converted to `409`.

### `GET /teachers/lessons`, `GET /teachers/lessons/chapter/:chapterId`, and `GET /teachers/lessons/:lessonId`

The list routes are filtered by `createdBy: req.teacher._id` and
`isArchived: false`. Pagination is supported for `/teachers/lessons` via
`page` and `limit` query parameters, with a default of `page=1` and
`limit=20`. `GET /teachers/lessons/chapter/:chapterId` returns all lessons in
one owned chapter in ascending `order` sequence. Items and list responses are
populated with the chapter metadata (`title`, `subjectId`, and `order`) and
prerequisite lesson summaries (`title` and `order`).

### `PATCH /teachers/lessons/:lessonId`

The update route accepts only the supported lesson fields listed above. The
controller also checks duplicate prerequisite IDs and ensures a lesson does not
reference itself.

Example valid update:

```http
PATCH /teachers/lessons/64f1c5d2b7b4a12345678911
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "title": "Newton's Laws and Applications",
  "estimatedDuration": 40,
  "tags": ["jee", "physics", "mechanics"]
}
```

When AI-relevant fields change (`title`, `description`, `learningObjectives`,
`topics`, `tags`, or `aiContext`), the code increments `contentVersion` and
marks `aiProcessing.status` as `stale` so downstream AI processing can refresh
indexing.

### `PATCH /teachers/lessons/:lessonId/publish` and `PATCH /teachers/lessons/:lessonId/unpublish`

Publishing sets `status` to `published` and `publishedAt` to the current time.
Unpublishing resets `status` to `draft` and clears `publishedAt`. Both routes
require an existing, non-archived, teacher-owned lesson. Publishing also checks
that the lesson has a non-empty title and a valid chapterId.

### `DELETE /teachers/lessons/:lessonId`

Soft archives the lesson by setting `isArchived: true`, `status: "draft"`, and
`publishedAt: null`. The document is not physically removed from MongoDB.

### Current implementation caveats

The lesson controller is active but still contains several runtime rough edges
that are important to document when integrating with the API:

- `createLesson` validates `prerequisites` only if the field is present, but the
  later code still calls `prerequisites.some(...)` unconditionally; omitting the
  field can therefore trigger a runtime error in the current implementation.
- `updateLesson` uses several misspelled identifiers (`isValidStirng`,
  `mogoose`, and `new set`) and should be treated as brittle until corrected.
- The controller does not centralize all validation errors through a single
  error wrapper; MongoDB duplicate-key and Mongoose validation failures are
  handled in place.

## Response conventions and caveats

- Catalog endpoints use `status: "success"`/`"failed"`; auth responses do not
  consistently include a `status` property.
- Authentication middleware returns `401` for missing/invalid token and
  `403` for a role mismatch.
- There is no centralized error response handler. For the observed formats,
  see [Error handling](./error-handling.md).
- Teacher profile `GET /teachers/me` currently includes the password hash in
  its response. Do not treat the response as safe to expose.
- Chapter PATCH has the validation defects described above. These are
  documented, not corrected by this documentation-only change.

## Teacher question bank

Question-bank routes are registered in `backend/routes/question.routes.js`, mounted at
`/teachers/questions`, and require a teacher session cookie. Questions are
owned by the authenticated teacher and linked to an existing, non-archived
chapter owned by that teacher. The request cannot set `createdBy`.

| Method | Exact route | Purpose |
|---|---|---|
| POST | `/teachers/questions` | Create a question |
| GET | `/teachers/questions` | List the teacher's questions |
| GET | `/teachers/questions/:questionId` | Retrieve one owned question |
| PATCH | `/teachers/questions/:questionId` | Update an active owned question |
| DELETE | `/teachers/questions/:questionId` | Deactivate an active owned question |

### Create question

Required JSON fields: `questionText`, `questionType`, `difficulty`,
`subject`, and `chapterId`. The `questionType` is one of
`SINGLE_CORRECT`, `MULTIPLE_CORRECT`, or `NUMERICAL`; difficulty is
`EASY`, `MEDIUM`, or `HARD`; subject is `PHYSICS`, `CHEMISTRY`, or
`MATHEMATICS`.

MCQs use `options: [{ "key": "A", "text": "..." }]` and `correctOptions`
containing the corresponding keys. Single-correct questions require exactly
one correct key; multiple-correct questions require at least one. Numerical
questions use `numericalAnswer` and may specify a non-negative
`numericalTolerance`. Optional `marking` supports correct, incorrect,
unattempted, and multiple-correct partial-marking values.

The server validates question structure and confirms that the chapter belongs
to the logged-in teacher. The question subject must match the chapter's
subject name when that name maps to a supported subject value. Success returns
`201`; invalid question data returns `400`; missing or non-owned chapters
return `404`.

Example MCQ request:

```http
POST /teachers/questions
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "questionText": "What is 2 + 2?",
  "questionType": "SINGLE_CORRECT",
  "options": [
    { "key": "A", "text": "3" },
    { "key": "B", "text": "4" },
    { "key": "C", "text": "5" },
    { "key": "D", "text": "6" }
  ],
  "correctOptions": ["B"],
  "difficulty": "EASY",
  "subject": "MATHEMATICS",
  "chapterId": "<owned-chapter-id>",
  "topicTags": ["arithmetic"],
  "marking": {
    "correctMarks": 4,
    "incorrectMarks": -1,
    "unattemptedMarks": 0
  }
}
```

### List, update, and deactivate

The list route supports `page` (default `1`), `limit` (default `20`, maximum
`100`), and optional `chapterId`, `subject`, `difficulty`,
`questionType`, and `active` filters. By default it returns active questions
only. The response includes a pagination object with page, limit, total, and
pages.

Updates accept only question fields supported by the model; owner identity and
active state cannot be changed through the update body. Updating validates the
merged question and verifies the target chapter is still owned by the teacher.
Delete is a soft deactivation (`isActive: false`), not a physical database
deletion. Reads and mutations are scoped to the authenticated teacher. Invalid
IDs return `400`; missing or non-owned questions return `404`.
