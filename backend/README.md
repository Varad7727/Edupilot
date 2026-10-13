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
| GET | `/subjects/:subjectId` | Fetch one active subject by ID | No |

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
curl -X GET http://localhost:5000/subjects/64f1c5d2b7b4a1234567890d
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

This documentation reflects the current backend implementation and routes defined in the codebase.
