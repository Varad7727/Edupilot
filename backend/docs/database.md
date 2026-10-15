# Database Models

The application uses Mongoose models backed by MongoDB. Schemas are declared
in `backend/model/`. No migration framework is present. Mongoose timestamps
are enabled on Student, Teacher, Course, Subject, Chapter, Class, and
CourseEnrollment.

## Relationship overview

```mermaid
erDiagram
    COURSE ||--o{ SUBJECT : contains
    SUBJECT ||--o{ CHAPTER : contains
    TEACHER ||--o{ CHAPTER : creates
    TEACHER ||--o{ CLASS : teaches
    STUDENT ||--o{ COURSE_ENROLLMENT : enrolls
    COURSE ||--o{ COURSE_ENROLLMENT : has
```

`CourseEnrollment` models the many-to-many relationship between students and
courses. The `Class.subject` field is plain text, not a Mongoose reference.

## Model summary

| Model | Collection (Mongoose default) | Source | Role |
|---|---|---|---|
| Student | `students` | `backend/model/student.model.js` | Student account and credentials |
| Teacher | `teachers` | `backend/model/teacher.model.js` | Teacher account and credentials |
| Course | `courses` | `backend/model/course.model.js` | Class-level academic course |
| Subject | `subjects` | `backend/model/subject.model.js` | Subject belonging to a course |
| Chapter | `chapters` | `backend/model/chapter.model.js` | Teacher-authored chapter belonging to a subject |
| Class | `classes` | `backend/model/class.model.js` | Class record associated with a teacher |
| CourseEnrollment | `courseenrollments` | `backend/model/enrollment.model.js` | Student-course enrollment relation |

Collection names are Mongoose's standard pluralized names inferred from the
model names; no explicit collection names are configured.

`backend/model/lesson.model.js` currently contains only an empty schema
declaration. It does not define or export a Mongoose model and is not used by
any controller or route, so it does not currently correspond to a usable
database model or API.

## Account models

Student and Teacher schemas share these fields:

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `firstName` | String | Required | Minimum 4 characters |
| `lastName` | String | Required | Minimum 2 characters |
| `email` | String | Required | Unique, lowercase, trimmed |
| `password` | String | Required | Minimum 6 characters; controllers store bcrypt hashes |
| `role` | String | Defaults to model role | Immutable; `"student"` or `"teacher"` |
| `createdAt`, `updatedAt` | Date | Automatic | Mongoose timestamps |

Models: `backend/model/student.model.js` and
`backend/model/teacher.model.js`. A unique index is declared for each email
through `unique: true`. The controllers normalize email to lowercase before
querying or saving.

Registration controller checks non-empty strings before schema validation.
Teacher profile password updates require at least 8 characters, which is
stricter than the account schema's six-character minimum.

## Course

Source: `backend/model/course.model.js`.

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `name` | String | Required | Trimmed |
| `code` | String | Required | Unique, uppercase, trimmed |
| `description` | String | Defaults to `""` | Trimmed |
| `classLevel` | Number | Required | Only `11` or `12`; unique |
| `isActive` | Boolean | Defaults to `true` | Used to filter public catalog reads |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

The unique `classLevel` constraint means the schema permits only one course
per class level.

## Subject

Source: `backend/model/subject.model.js`.

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `name` | String | Required | Trimmed |
| `code` | String | Required | Uppercase, trimmed |
| `courseId` | ObjectId → Course | Required | Parent-course reference |
| `description` | String | Defaults to `""` | Trimmed |
| `displayOrder` | Number | Defaults to `0` | Used for ascending display order |
| `isActive` | Boolean | Defaults to `true` | Used by catalog endpoints |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

Unique compound index: `{ courseId: 1, code: 1 }`, so a course cannot contain
the same subject code twice while another course can use that code.

## Chapter

Source: `backend/model/chapter.model.js`.

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `title` | String | Required | Trimmed; 2–150 characters |
| `description` | String | Defaults to `""` | Trimmed; maximum 2,000 characters |
| `subjectId` | ObjectId → Subject | Required | Indexed |
| `createdBy` | ObjectId → Teacher | Required | Indexed; set by authenticated create route |
| `order` | Number | Required | Minimum `1` |
| `status` | String | Defaults to `"draft"` | `"draft"` or `"published"` |
| `isArchived` | Boolean | Defaults to `false` | Soft archive flag |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

Unique compound index: `{ subjectId: 1, order: 1 }`. Chapter order is unique
within each subject. Since archived documents remain stored and keep their
index entry, an archived chapter's order cannot be reused in that subject
unless the archived record's order is changed or the record is removed through
some other database operation.

## Class

Source: `backend/model/class.model.js`. There are currently no mounted class
routes or class controller.

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `className` | String | Required | Trimmed |
| `description` | String | Required; defaults to `""` | Trimmed |
| `subject` | String | Required | Trimmed; not a reference |
| `classCode` | String | Required | Unique, uppercase, trimmed |
| `teacher` | ObjectId → Teacher | Required | Teacher reference |
| `isActive` | Boolean | Defaults to `true` | — |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

## CourseEnrollment

Source: `backend/model/enrollment.model.js`. There are currently no mounted
enrollment routes or enrollment controller.

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `student` | ObjectId → Student | Required | Student reference |
| `course` | ObjectId → Course | Required | Course reference |
| `enrolledAt` | Date | Defaults to `Date.now` | — |
| `status` | String | Defaults to `"active"` | Only `"active"` is allowed |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

Unique compound index: `{ student: 1, course: 1 }`, preventing duplicate
enrollment documents for a student/course pair.

## Index and validation notes

- Mongoose `unique: true` and explicit unique indexes create database
  constraints; they are not ordinary request validators. A race can still
  produce a MongoDB duplicate-key error after a controller's pre-check.
- `runValidators: true` is used for chapter updates. Other update behavior
  depends on the particular query options used by the controller.
- References are ObjectId fields with `ref` metadata. Referential existence
  is not enforced as a MongoDB foreign-key constraint; the chapter create
  controller explicitly checks that its subject exists and is active.
- No migration tooling is configured. The seed script updates course and
  subject records but does not migrate schemas.
