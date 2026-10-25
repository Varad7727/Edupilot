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
    CHAPTER ||--o{ LESSON : contains
    CHAPTER ||--o{ DPP : contains
    DPP }o--o{ QUESTION : references
    TEACHER ||--o{ CHAPTER : creates
    TEACHER ||--o{ LESSON : creates
    LESSON }o--o{ LESSON : prerequisites
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
| Lesson | `lessons` | `backend/model/lesson.model.js` | Ordered teaching unit inside a chapter, with AI and publication metadata |
| DPP | `dpps` | `backend/model/dpp.model.js` | Teacher-owned practice set for a chapter, with ordered Question references |
| Question | `questions` | `backend/model/question.model.js` | Shared teacher-authored question and marking data |
| Class | `classes` | `backend/model/class.model.js` | Class record associated with a teacher |
| CourseEnrollment | `courseenrollments` | `backend/model/enrollment.model.js` | Student-course enrollment relation |

Collection names are Mongoose's standard pluralized names inferred from the
model names; no explicit collection names are configured.

`backend/model/lesson.model.js` is active code and is used by the teacher
lesson routes and controller. The schema supports chapter-scoped lesson
ordering, prerequisites, AI indexing state, and publication status.

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

## Lesson

Source: `backend/model/lesson.model.js`.

| Field | Type | Required/default | Validation and constraints |
|---|---|---|---|
| `title` | String | Required | Trimmed; 3–150 characters |
| `description` | String | Defaults to `""` | Trimmed; maximum 2,000 characters |
| `chapterId` | ObjectId → Chapter | Required | Indexed; lesson belongs to a teacher-owned chapter |
| `createdBy` | ObjectId → Teacher | Required | Indexed; the lesson owner |
| `order` | Number | Required | Positive integer; unique within a chapter |
| `estimatedDuration` | Number | Defaults to `0` | Non-negative |
| `difficulty` | String | Defaults to `"intermediate"` | One of `beginner`, `intermediate`, `advanced` |
| `learningObjectives` | String[] | Defaults to `[]` | Array of lesson goals |
| `topics` | String[] | Defaults to `[]` | Each item trimmed; max 100 chars |
| `tags` | String[] | Defaults to `[]` | Lowercased, trimmed, max 50 chars each |
| `prerequisites` | ObjectId[] → Lesson | Optional | Must reference existing teacher-owned lessons |
| `contentVersion` | Number | Defaults to `1` | Minimum `1`; incremented when AI-relevant fields change |
| `aiContext.language` | String | Defaults to `"en"` | Plain language code |
| `aiContext.syllabus` | String | Defaults to `"JEE"` | Syllabus identifier |
| `aiContext.learningLevel` | String | Defaults to `"mixed"` | One of `foundation`, `jee-main`, `jee-advanced`, `mixed` |
| `aiContext.taxonomyNodeIds` | String[] | Defaults to `[]` | Optional taxonomy IDs |
| `aiProcessing.status` | String | Defaults to `"not_started"` | One of `not_started`, `pending`, `processing`, `completed`, `failed`, `stale` |
| `aiProcessing.indexedVersion` | Number | Defaults to `0` | Non-negative |
| `aiProcessing.lastProcessedAt` | Date | `null` | Last successful AI processing time |
| `aiProcessing.lastError` | String | `null` | Error summary capped at 1,000 chars |
| `status` | String | Defaults to `"draft"` | One of `draft` or `published` |
| `publishedAt` | Date | `null` | Set when the lesson is published |
| `isArchived` | Boolean | Defaults to `false` | Soft-delete flag; used in teacher reads and filtering |
| `createdAt`, `updatedAt` | Date | Automatic | Mongoose timestamps |

Index highlights:

- `{ chapterId: 1, order: 1 }` is unique, so the lesson order is valid within a chapter.
- `{ createdBy: 1, chapterId: 1, isArchived: 1, order: 1 }` supports teacher dashboard ordering.
- `{ topics: 1, status: 1 }` supports topic-based discovery.

The schema intentionally separates content metadata from AI processing state, which lets the app mark lessons stale when AI-relevant fields are changed before reprocessing.

## DPP

Source: `backend/model/dpp.model.js`. DPP endpoints are mounted at
`/teachers/dpps` and are protected by teacher authentication.

| Field | Type | Required/default | Validation and behavior |
|---|---|---|---|
| `title` | String | Required | Trimmed; 2–150 characters |
| `description` | String | Defaults to `""` | Trimmed; maximum 2,000 characters |
| `instructions` | String | Defaults to `""` | Trimmed; maximum 5,000 characters |
| `chapterId` | ObjectId → Chapter | Required | Indexed; create controller checks teacher ownership and archive state |
| `questions` | Embedded array | Defaults to `[]` | Each item has required `questionId` and `order`; no embedded `_id` |
| `questions[].questionId` | ObjectId → Question | Required | A question reference; DPP model prevents duplicate IDs |
| `questions[].order` | Number | Required | Minimum 1; DPP model prevents duplicate positions |
| `durationMinutes` | Number | Required | 1–600; create endpoint requires an integer |
| `deadline` | Date | Required | Create endpoint requires a valid future date; determines on-time eligibility, not accessibility |
| `totalMarks` | Number | Defaults to `0` | Non-negative; calculated by the DPP controller from question correct marks |
| `creationMethod` | String | Defaults to `"MANUAL"` | `MANUAL`, `PDF`, `IMAGE`, or `MIXED` |
| `status` | String | Defaults to `"draft"` | `draft` or `published`; current create route always creates drafts |
| `createdBy` | ObjectId → Teacher | Required | Indexed; assigned from authenticated teacher |
| `isArchived` | Boolean | Defaults to `false` | Teacher listing and detail routes exclude archived DPPs |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

Indexes: `{ chapterId: 1, status: 1, deadline: 1 }` and
`{ createdBy: 1, createdAt: -1 }`. The schema validates uniqueness of
question IDs and order values. The create controller further requires
question orders to be continuous starting at 1 and validates referenced
questions' chapter and active state.

## Question

Source: `backend/model/question.model.js`. Questions are created by the
nested draft-DPP route; there is no separate question-bank route.

| Field | Type | Required/default | Validation and behavior |
|---|---|---|---|
| `questionText` | String | Required | Trimmed |
| `questionType` | String | Required | `SINGLE_CORRECT`, `MULTIPLE_CORRECT`, or `NUMERICAL` |
| `options` | Embedded array | Defaults to `[]` | Each option has required trimmed `key` and `text`; embedded `_id` disabled |
| `correctOptions` | String[] | Defaults to `[]` | Answer keys for MCQs |
| `numericalAnswer` | Number | Conditional | Used for numerical questions |
| `numericalTolerance` | Number | Defaults to `0` | Minimum 0 |
| `explanation` | String | Defaults to `""` | Trimmed |
| `image` | Embedded object | Optional | HTTPS URL required by question utility; optional file ID/path and alt text (maximum 250 characters) |
| `difficulty` | String | Required | `EASY`, `MEDIUM`, or `HARD` |
| `subject` | String | Required | `PHYSICS`, `CHEMISTRY`, or `MATHEMATICS` |
| `chapterId` | ObjectId → Chapter | Required | Indexed; controller derives this from the owning DPP |
| `topicTags` | String[] | Defaults to `[]` | Topic labels |
| `marking` | Embedded object | Defaults to `{}` | Correct marks default to 4, incorrect to -1, unattempted to 0; may include partial rules |
| `createdBy` | ObjectId → Teacher | Required | Controller derives this from authentication |
| `isActive` | Boolean | Defaults to `true` | Used when validating DPP question references |
| timestamps | Dates | Automatic | `createdAt`, `updatedAt` |

The question validation utility enforces type-specific answer rules, unique
option keys, and valid answer references. It also permits partial-marking
rules only for `MULTIPLE_CORRECT`. The schema index
`{ chapterId: 1, questionType: 1, difficulty: 1 }` supports chapter-scoped
question queries.

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
