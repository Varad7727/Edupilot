# Backend Authentication Documentation

This backend exposes all authentication-related APIs under the `/auth` base path and uses:

- Express.js for routing
- MongoDB with Mongoose models
- JWT for token generation
- `bcrypt` for password hashing
- HTTP-only cookies to store the auth token

## Base URL

```text
http://localhost:<PORT>/auth
```

Example if the server is running on port `5000`:

```text
http://localhost:5000/auth
```

## Authentication Flow

1. User registers or logs in.
2. The server creates a JWT with the user ID and role.
3. The JWT is stored in a cookie named `token`.
4. Later requests can use the cookie for protected routes.
5. Logout clears the `token` cookie.

## User Models

The authentication system supports two roles:

- Student
- Teacher

Each model contains:

- `firstName`
- `lastName`
- `email`
- `password`
- `role`
- timestamps (`createdAt`, `updatedAt`)

Passwords are hashed before being saved, and email values are normalized to lowercase before database checks.

## Routes

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/auth/student/register` | Register a new student account | No |
| POST | `/auth/student/login` | Log in as a student | No |
| POST | `/auth/student/logout` | Log out the current student | Yes |
| POST | `/auth/teacher/register` | Register a new teacher account | No |
| POST | `/auth/teacher/login` | Log in as a teacher | No |
| POST | `/auth/teacher/logout` | Log out the current teacher | Yes |

## Middleware

The backend includes two middlewares:

- `authStudentMiddleware`
- `authTeacherMiddleware`

They verify the `token` cookie and ensure the decoded JWT role matches the protected route.

### Student Middleware

- Reads `req.cookies.token`
- Rejects with `401` when no token is found
- Verifies token using `JWT_SECRET`
- Rejects with `403` if role is not student
- Loads the student from MongoDB and stores it as `req.student`

### Teacher Middleware

- Reads `req.cookies.token`
- Rejects with `401` when no token is found
- Verifies token using `JWT_SECRET`
- Rejects with `403` if role is not teacher
- Loads the teacher from MongoDB and stores it as `req.teacher`

## Register Student

### Endpoint

```http
POST /auth/student/register
```

### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

### Validation Rules

- `firstName` is required and must be a non-empty string
- `lastName` is required and must be a non-empty string
- `email` is required and must be a non-empty string
- `password` is required and must be a non-empty string
- duplicate email is rejected

### Success Response

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "64f1c5d2b7b4a1234567890a",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Error Response Examples

#### Missing required fields

```json
{
  "message": "All fields are required"
}
```

#### Duplicate user

```json
{
  "message": "User already exists"
}
```

## Login Student

### Endpoint

```http
POST /auth/student/login
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

### Success Response

```json
{
  "message": "User logged in successfully",
  "user": {
    "_id": "64f1c5d2b7b4a1234567890a",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Error Response Examples

```json
{
  "message": "Invalid email or password"
}
```

```json
{
  "message": "Email and password are required"
}
```

## Logout Student

### Endpoint

```http
POST /auth/student/logout
```

### Auth Requirement

This route is protected by `authStudentMiddleware`.

### Success Response

```json
{
  "message": "User logged out successfully"
}
```

## Register Teacher

### Endpoint

```http
POST /auth/teacher/register
```

### Request Body

```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice@example.com",
  "password": "123456"
}
```

### Success Response

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "64f1c5d2b7b4a1234567890b",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "teacher"
  }
}
```

### Error Response Examples

```json
{
  "message": "All fields are required"
}
```

```json
{
  "message": "User already exists"
}
```

## Login Teacher

### Endpoint

```http
POST /auth/teacher/login
```

### Request Body

```json
{
  "email": "alice@example.com",
  "password": "123456"
}
```

### Success Response

```json
{
  "message": "User logged in successfully",
  "user": {
    "_id": "64f1c5d2b7b4a1234567890b",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "teacher"
  }
}
```

### Error Response Examples

```json
{
  "message": "Invalid email or password"
}
```

```json
{
  "message": "Email and password are required"
}
```

## Logout Teacher

### Endpoint

```http
POST /auth/teacher/logout
```

### Auth Requirement

This route is protected by `authTeacherMiddleware`.

### Success Response

```json
{
  "message": "User logged out successfully"
}
```

## Cookie Behavior

When a user logs in or registers successfully, the server sends a cookie named `token`.

### Cookie Parameters

- `httpOnly: true`
- `sameSite: "strict"`
- `secure: true` in production
- `maxAge: 24 * 60 * 60 * 1000` (1 day)

Browsers automatically include this cookie in later requests when same-site and valid.

## Example Requests with curl

### Register a student

```bash
curl -X POST http://localhost:5000/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "123456"
  }'
```

### Login a student

```bash
curl -X POST http://localhost:5000/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "123456"
  }'
```

### Logout a student using the saved cookie

```bash
curl -X POST http://localhost:5000/auth/student/logout \
  -b cookies.txt
```

### Register a teacher

```bash
curl -X POST http://localhost:5000/auth/teacher/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com",
    "password": "123456"
  }'
```

### Login a teacher

```bash
curl -X POST http://localhost:5000/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "123456"
  }'
```

### Logout a teacher using the saved cookie

```bash
curl -X POST http://localhost:5000/auth/teacher/logout \
  -b cookies.txt
```

## Example Flow Using Browser Cookies

```bash
# 1. Register or login
# Browser receives a cookie named: token

# 2. Use the protected route in the same browser session
# The cookie is sent automatically with the request
```

## Common Status Codes

| Status | Meaning |
|---|---|
| 200 | Success / login or logout completed |
| 201 | New user created successfully |
| 400 | Invalid input or duplicate email |
| 401 | Missing token or invalid JWT |
| 403 | User is authenticated but does not have the correct role |
| 500 | Internal server error |

## Course and Academic Management APIs

The backend also exposes course and subject catalog APIs for academic content management. These endpoints are mounted from the course route module and are primarily read-only.

## Base URLs

```text
http://localhost:<PORT>/courses
http://localhost:<PORT>/subjects
```

Example:

```text
http://localhost:5000/courses
http://localhost:5000/subjects/64f1c5d2b7b4a1234567890c
```

## Course Model

The `Course` model defines a standard academic course record.

### Fields

- `name`: course name
- `code`: unique course code, stored in uppercase
- `description`: course description
- `classLevel`: required academic level; allowed values are `11` and `12`
- `isActive`: boolean flag for active/inactive records
- `timestamps`: `createdAt`, `updatedAt`

### Schema Example

```json
{
  "name": "Physics",
  "code": "PHY",
  "description": "Foundation and advanced physics concepts",
  "classLevel": 11,
  "isActive": true
}
```

## Subject Model

The `Subject` model represents subjects belonging to a course.

### Fields

- `name`: subject name
- `code`: subject code unique within a course
- `courseId`: reference to the parent course
- `description`: subject description
- `displayOrder`: ordering value used for sorting
- `isActive`: boolean value to enable/disable a subject
- `timestamps`: `createdAt`, `updatedAt`

### Unique Index

A subject code is unique per course:

```text
{ courseId: 1, code: 1 }
```

### Schema Example

```json
{
  "name": "Mechanics",
  "code": "PHY101",
  "courseId": "64f1c5d2b7b4a1234567890a",
  "description": "Motion, force, and energy fundamentals",
  "displayOrder": 1,
  "isActive": true
}
```

## Class Model

The `Class` model is defined in the backend for class scheduling and teacher association.

### Fields

- `className`: name of the class
- `description`: class description
- `subject`: subject name or subject identifier string
- `classCode`: unique class code, uppercase by default
- `teacher`: reference to a `Teacher` document
- `isActive`: active/inactive flag
- `timestamps`: `createdAt`, `updatedAt`

### Schema Example

```json
{
  "className": "Grade 11 Physics A",
  "description": "Morning physics class",
  "subject": "Physics",
  "classCode": "PHY-A",
  "teacher": "64f1c5d2b7b4a1234567890b",
  "isActive": true
}
```

## Enrollment Model

The `CourseEnrollment` model tracks which students are enrolled in which courses.

### Fields

- `student`: reference to a `Student`
- `course`: reference to a `Course`
- `enrolledAt`: enrollment date
- `status`: currently allowed value is `"active"`
- `timestamps`: `createdAt`, `updatedAt`

### Unique Index

A student cannot enroll in the same course multiple times:

```text
{ student: 1, course: 1 }
```

### Schema Example

```json
{
  "student": "64f1c5d2b7b4a1234567890c",
  "course": "64f1c5d2b7b4a1234567890a",
  "enrolledAt": "2026-10-14T01:00:00.000Z",
  "status": "active"
}
```

## Course Routes

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/courses` | Fetch all active courses | No |
| GET | `/courses/:courseId` | Fetch one active course by ID | No |
| GET | `/courses/:courseId/subjects` | Fetch all active subjects for a course | No |
| GET | `/courses/subjects/:subjectId` | Fetch one active subject by ID | No |

The application mounts the same course router at both `/courses` and `/subjects`.
The `/courses` paths above are the canonical paths. The additional `/subjects`
mount also exposes less intuitive aliases, including
`GET /subjects/subjects/:subjectId` for looking up a subject by ID.

## Course Controller Behavior

### `getAllCourses`

- Finds all courses where `isActive` is `true`
- Selects only `name`, `code`, `description`, and `classLevel`
- Sorts by `classLevel` ascending
- Returns JSON with status and course list

### `getCoursesById`

- Validates the `courseId` as a valid MongoDB ObjectId
- Finds a course with matching ID and `isActive: true`
- Returns `404` if no course exists
- Returns `400` if the ID format is invalid

## Subject Controller Behavior

### `getSubjectsByCourse`

- Validates `courseId`
- Confirms the course exists and is active
- Finds all active subjects for the course
- Sorts by `displayOrder`
- Returns a count and array of subjects

### `getSubjectById`

- Validates `subjectId`
- Finds a subject with `isActive: true`
- Populates the parent course information
- Returns subject details with course metadata

## Endpoint Examples

### Get all courses

```bash
curl -X GET http://localhost:5000/courses
```

### Get one course by ID

```bash
curl -X GET http://localhost:5000/courses/64f1c5d2b7b4a1234567890a
```

### Get subjects for a course

```bash
curl -X GET http://localhost:5000/courses/64f1c5d2b7b4a1234567890a/subjects
```

### Get one subject by ID

```bash
curl -X GET http://localhost:3000/courses/subjects/64f1c5d2b7b4a1234567890d
```

## Example Success Response: Get All Courses

```json
{
  "message": "Courses retrieved successfully.",
  "status": "success",
  "data": [
    {
      "_id": "64f1c5d2b7b4a1234567890a",
      "name": "Physics",
      "code": "PHY",
      "description": "Foundation and advanced physics concepts",
      "classLevel": 11
    }
  ]
}
```

## Example Success Response: Get Subjects by Course

```json
{
  "status": "success",
  "count": 2,
  "subject": [
    {
      "_id": "64f1c5d2b7b4a1234567890d",
      "name": "Mechanics",
      "code": "PHY101",
      "description": "Motion, force, and energy fundamentals",
      "displayOrder": 1,
      "courseId": "64f1c5d2b7b4a1234567890a"
    },
    {
      "_id": "64f1c5d2b7b4a1234567890e",
      "name": "Electricity",
      "code": "PHY102",
      "description": "Current, circuits, and electric fields",
      "displayOrder": 2,
      "courseId": "64f1c5d2b7b4a1234567890a"
    }
  ]
}
```

## Example Error Responses

### Invalid course ID

```json
{
  "status": "failed",
  "message": "Invalid course ID."
}
```

### Course not found

```json
{
  "status": "failed",
  "message": "Course not found."
}
```

### Invalid subject ID

```json
{
  "status": "failed",
  "message": "Invalid subject ID."
}
```

### Subject not found

```json
{
  "status": "failed",
  "message": "Subject not found."
}
```

## Notes

- Student and teacher registration/login use `role: "student"` and `role: "teacher"` in the JWT payload.
- On protected requests, the JWT is verified using `process.env.JWT_SECRET`.
- The logout route clears the same cookie that was created at login/register time.
- The auth system currently relies on cookie-based auth, so front-end clients must allow cookies and use the same domain/session context.
- Course and subject APIs are currently read-only and return only active records.
- The route setup in [backend/app.js](C:/Users/Varad/Desktop/edupilot/backend/app.js) mounts `/courses` and also reuses the same router for `/subjects`, which is why subject routes can be accessed through both patterns.
- The current server entry point listens on port `3000`. Replace the port in examples only if the server is configured to listen on a different port.

This documentation reflects the current backend implementation and routes defined in the codebase.

## Teacher Profile and Chapter APIs

The teacher profile and chapter endpoints are mounted under `/teachers` and
`/teachers/chapters`. Both route groups require an authenticated teacher.
Authentication is cookie-based: first log in through `/auth/teacher/login`, then
send the resulting `token` cookie with each protected request. The middleware
verifies the JWT using `JWT_SECRET`, checks that its role is `teacher`, and
loads the teacher document for the controller.

For local development, the server entry point listens on port `3000`:

```text
http://localhost:3000
```

### Teacher routes

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | `/teachers/me` | Retrieve the authenticated teacher profile | Yes |
| PATCH | `/teachers/update` | Update one or more profile fields | Yes |

#### Get the current teacher

```http
GET /teachers/me
```

Example:

```bash
curl -i http://localhost:3000/teachers/me -b cookies.txt
```

A successful response has `status: "success"`, a message, and the teacher
document in `data`. The current controller returns the full document rather
than excluding its password field. Treat the returned record as sensitive and
do not expose it to other users or log it. A missing teacher record returns
`404`; an internal failure returns `500`.

#### Update the current teacher

```http
PATCH /teachers/update
Content-Type: application/json
```

The body may contain one or more of these fields:

| Field | Validation and handling |
|---|---|
| `firstName` | String with at least 4 non-whitespace characters; trimmed before saving |
| `lastName` | String with at least 2 non-whitespace characters; trimmed before saving |
| `email` | Valid email format; trimmed, converted to lowercase, and rejected with `409` if another teacher uses it |
| `password` | String of at least 8 characters; hashed with bcrypt before saving |

At least one supported field is required. An empty update returns `400`.
Successful updates return `data` with the password excluded. Invalid field
values return `400`, an already-registered email returns `409`, a missing
teacher returns `404`, and an unexpected error returns `500`.

Example request to update a teacher's name and email:

```bash
curl -i -X PATCH http://localhost:3000/teachers/update \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"firstName":"Alice","lastName":"Smith","email":"alice.smith@example.com"}'
```

Example response:

```json
{
  "status": "success",
  "message": "Teacher profile updated successfully.",
  "data": {
    "_id": "64f1c5d2b7b4a1234567890b",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@example.com",
    "role": "teacher"
  }
}
```

### Chapter routes

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/teachers/chapters` | Create a chapter under an active subject | Yes |
| GET | `/teachers/chapters` | List the authenticated teacher's non-archived chapters | Yes |
| GET | `/teachers/chapters/:chapterId` | Retrieve one of the teacher's non-archived chapters | Yes |
| PATCH | `/teachers/chapters/:chapterId` | Update a chapter owned by the teacher | Yes |
| DELETE | `/teachers/chapters/:chapterId` | Archive a chapter (soft delete) | Yes |

The chapter controller scopes listing, reading, updating, and archiving to the
authenticated teacher's ID. A teacher cannot read, change, or archive another
teacher's chapter by supplying its ID. Chapter IDs and subject IDs must be
valid MongoDB ObjectIds.

#### How the chapter router is assembled

The chapter router declares paths relative to its mount point. In
`app.js`, it is mounted with:

```js
app.use("/teachers/chapters", chapterRoutes);
```

Each route runs `authTeacherMiddleware` before its controller. The router
declarations therefore resolve to these complete method/path/controller
combinations:

| Router method and local path | Complete method and path | Controller |
|---|---|---|
| `POST /` | `POST /teachers/chapters` | `createChapter` |
| `GET /` | `GET /teachers/chapters` | `getMyChapters` |
| `GET /:chapterId` | `GET /teachers/chapters/:chapterId` | `getChapterById` |
| `PATCH /:chapterId` | `PATCH /teachers/chapters/:chapterId` | `updateChapter` |
| `DELETE /:chapterId` | `DELETE /teachers/chapters/:chapterId` | `archiveChapter` |

For item routes, Express places the path segment in `req.params.chapterId`.
For the create route, the controller reads the JSON payload from `req.body`.
The middleware attaches the authenticated teacher to `req.teacher`, which is
used to set chapter ownership on creation and enforce ownership on subsequent
chapter operations. There are no public chapter routes in this router.

### Chapter model

Each chapter belongs to a `Subject` and records the `Teacher` who created it.
The schema contains:

| Field | Type | Rules and defaults |
|---|---|---|
| `title` | String | Required, trimmed, 2–150 characters |
| `description` | String | Optional; defaults to `""`, trimmed, maximum 2,000 characters |
| `subjectId` | ObjectId reference to `Subject` | Required and indexed |
| `createdBy` | ObjectId reference to `Teacher` | Required and indexed; set from the authenticated teacher, not from the request body |
| `order` | Number | Required, minimum `1`; unique for each `subjectId` |
| `status` | String | `"draft"` or `"published"`; defaults to `"draft"` |
| `isArchived` | Boolean | Defaults to `false`; archived chapters are excluded from teacher reads |
| timestamps | Dates | Mongoose manages `createdAt` and `updatedAt` |

The compound unique index `{ subjectId: 1, order: 1 }` means two chapters
cannot have the same order number within one subject. The same order number
can be used in a different subject. Archiving sets `isArchived` to `true`;
it does not permanently remove the MongoDB document.

### Create a chapter

```http
POST /teachers/chapters
Content-Type: application/json
```

Required request properties are `title`, `subjectId`, and `order`.
`description` is optional. The subject must exist and have `isActive: true`.
The server sets `createdBy` from the authenticated teacher and starts the new
chapter in `draft` status with `isArchived: false`.

Example request:

```bash
curl -i -X POST http://localhost:3000/teachers/chapters \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Kinematics","description":"Position, velocity, and acceleration","subjectId":"64f1c5d2b7b4a1234567890d","order":1}'
```

Example success response (`201 Created`):

```json
{
  "status": "success",
  "message": "Chapter created successfully.",
  "data": {
    "_id": "64f1c5d2b7b4a1234567890f",
    "title": "Kinematics",
    "description": "Position, velocity, and acceleration",
    "subjectId": "64f1c5d2b7b4a1234567890d",
    "createdBy": "64f1c5d2b7b4a1234567890b",
    "order": 1,
    "status": "draft",
    "isArchived": false
  }
}
```

Missing required properties or invalid values return `400`. A malformed
subject ID returns `400`; a subject that is missing or inactive returns
`404`. An order conflict for the same subject is subject to the database's
unique index and is not given a dedicated conflict response by the controller.

### List and retrieve chapters

List the signed-in teacher's active (not archived) chapters:

```bash
curl -i http://localhost:3000/teachers/chapters -b cookies.txt
```

The list is sorted by `order` ascending and returns a `count` and a `data`
array. Each chapter's `subjectId` is populated with the subject's `name`,
`code`, and `courseId`.

Retrieve a single chapter:

```bash
curl -i http://localhost:3000/teachers/chapters/64f1c5d2b7b4a1234567890f \
  -b cookies.txt
```

The single-item response also contains the populated subject. An invalid ID
returns `400`; a chapter that does not exist, is archived, or belongs to
another teacher returns `404`.

Example list response:

```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "_id": "64f1c5d2b7b4a1234567890f",
      "title": "Kinematics",
      "description": "Position, velocity, and acceleration",
      "subjectId": {
        "_id": "64f1c5d2b7b4a1234567890d",
        "name": "Mechanics",
        "code": "PHY101",
        "courseId": "64f1c5d2b7b4a1234567890a"
      },
      "order": 1,
      "status": "draft",
      "isArchived": false
    }
  ]
}
```

### Update a chapter

Only `title`, `description`, `order`, and `status` are accepted in the JSON
body. `status` must be either `"draft"` or `"published"`. The chapter must
belong to the current teacher and must not already be archived.

Example request to publish the chapter and set its order:

```bash
curl -i -X PATCH http://localhost:3000/teachers/chapters/64f1c5d2b7b4a1234567890f \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"order":1,"status":"published"}'
```

Successful updates return `200` and the updated chapter in `data`. Invalid
chapter IDs, empty bodies, unsupported properties, and invalid field values
return `400`. A chapter that is missing, archived, or owned by a different
teacher returns `404`.

**Current implementation caveat:** although the route accepts `order` as an
optional update field and accepts `description`, the current controller's
validation means a PATCH request must include a valid `order`; a request that
updates `description` currently fails with `500`. Until that validation is
corrected, include `order` in every PATCH request and do not send
`description`.

### Archive a chapter

The `DELETE` route performs a soft archive, not a permanent delete:

```bash
curl -i -X DELETE http://localhost:3000/teachers/chapters/64f1c5d2b7b4a1234567890f \
  -b cookies.txt
```

On success the response is `200` with `isArchived: true` in `data`. The
chapter is no longer returned by the teacher's list or single-chapter
endpoint. An invalid ID returns `400`; a missing, already archived, or
another teacher's chapter returns `404`.

### Protected-route errors

All teacher routes use `authTeacherMiddleware`:

| HTTP status | Meaning |
|---|---|
| `401` | The `token` cookie is missing or its JWT is invalid/expired |
| `403` | The token is valid but its role is not `teacher` |
| `400` | The endpoint received an invalid ID, body, or field value |
| `404` | The requested teacher, subject, or teacher-owned chapter was not found |
| `409` | The requested teacher email is already registered |
| `500` | An unexpected server/database error occurred |

### Complete teacher workflow example

The following sequence logs in a teacher while saving the cookie, creates a
chapter for an existing active subject, lists that teacher's chapters, then
publishes the new chapter. Replace the example IDs and credentials with records
in your database.

```bash
# 1. Log in and save the token cookie.
curl -i -X POST http://localhost:3000/auth/teacher/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"alice@example.com","password":"correct-horse-battery"}'

# 2. Create a chapter in an active subject.
curl -i -X POST http://localhost:3000/teachers/chapters \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Kinematics","description":"Motion fundamentals","subjectId":"64f1c5d2b7b4a1234567890d","order":1}'

# 3. View the authenticated teacher's chapters.
curl -i http://localhost:3000/teachers/chapters -b cookies.txt

# 4. Publish the chapter. Include order in the PATCH body as noted above.
curl -i -X PATCH http://localhost:3000/teachers/chapters/64f1c5d2b7b4a1234567890f \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"order":1,"status":"published"}'
```

## Data Models Without Routes in This API

The `Class` and `CourseEnrollment` schemas are present in the backend, but no
class or enrollment routes are mounted in the current `app.js`. The model
definitions describe stored data only; they do not imply that clients can
create or query these records through an HTTP endpoint.

### Class schema details

In addition to the fields listed above, `className`, `description`, `subject`,
and `classCode` are required. `description` has a default empty string even
though it is marked required. `classCode` is unique, trimmed, and converted to
uppercase. `teacher` is a required ObjectId reference to `Teacher`; `isActive`
defaults to `true`.

### Course enrollment schema details

`student` and `course` are required ObjectId references to `Student` and
`Course`. `enrolledAt` defaults to the current date/time. `status` currently
supports only `"active"` and defaults to that value. The unique compound
index `{ student: 1, course: 1 }` prevents duplicate enrollment records for
the same student and course. Mongoose also manages `createdAt` and
`updatedAt`.

## Controller Implementation Notes

These notes explain the Mongoose and MongoDB query options called out in
controller comments and describe how they affect the responses in the
endpoints above.

### Selecting, sorting, and returning query results

The course and subject controllers use these Mongoose query helpers:

- `.select("fieldA fieldB")` limits the fields returned from MongoDB. Fields
  not selected are omitted from the response unless Mongoose includes them by
  default (for example, `_id`).
- `.sort({ field: 1 })` sorts in ascending order; `.sort({ field: -1 })` sorts
  in descending order. For example, active courses are sorted by `classLevel`
  ascending, while subjects are sorted by `displayOrder` ascending.
- `.lean()` returns plain JavaScript objects rather than full Mongoose
  documents. This is useful for read-only responses where document methods and
  change tracking are not needed.

These are query/response behaviors, not schema changes: using `.select()` does
not remove fields from the stored record, and `.lean()` does not update the
database.

### MongoDB comparison operators

The teacher controller comments list common MongoDB comparison operators:

| Operator | Meaning |
|---|---|
| `$eq` | Equal to |
| `$ne` | Not equal to |
| `$gt` | Greater than |
| `$lt` | Less than |
| `$gte` | Greater than or equal to |
| `$lte` | Less than or equal to |

In the current teacher profile update query, `$ne` excludes the authenticated
teacher's own document while checking whether another teacher already uses the
requested email:

```js
{
  email: updatedEmail,
  _id: { $ne: currentTeacherId }
}
```

The other operators above are included as a general reference; this does not
mean each one is used by the currently documented endpoints.

### Chapter update query options

Chapter updates use `findOneAndUpdate()` with a filter for the chapter ID,
authenticated owner, and `isArchived: false`.

- `returnDocument: "after"` asks Mongoose to return the document after the
  update, so the success response contains the updated values. Mongoose's
  commonly used `{ new: true }` option serves the same purpose.
- `runValidators: true` runs applicable schema validators for updated values,
  such as the title length, description maximum length, and minimum chapter
  order. This does not replace the controller's request validation.
- The owner and archive filters are part of the update query itself. If no
  document matches all of them, the controller returns `404` rather than
  updating a different teacher's chapter or an archived chapter.

Refer to the chapter update caveat above before sending PATCH requests:
the current controller's field checks do not fully match the optional update
fields advertised by the route.
