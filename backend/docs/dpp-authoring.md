# DPP Authoring, Questions, and Uploads

This guide describes the teacher-facing Daily Practice Problem (DPP)
authoring workflow implemented by the backend. It covers the DPP and Question
schemas, protected endpoints, request examples, validation, file uploads,
course seeding, tests, and troubleshooting.

## Scope and workflow

The relevant implementation is in:

- `backend/routes/dpp.routes.js` and `backend/controller/dpp.controller.js`
  for DPP creation, retrieval, and question creation.
- `backend/model/dpp.model.js` and `backend/model/question.model.js` for
  persistence and schema constraints.
- `backend/utils/questionValidation.utils.js` for question payload rules.
- `backend/routes/upload.routes.js`, `backend/controller/upload.controller.js`,
  and `backend/middleware/upload.middleware.js` for PDF and image uploads.
- `backend/seed/seedCourses.js` for the initial JEE course and subject
  catalog.

The implemented authoring flow is:

1. Authenticate as a teacher and create a chapter under a subject.
2. Create a DPP for a chapter. It is created as a `draft`; it may initially
   have no questions.
3. Optionally upload a source PDF and/or question image. Uploading a PDF only
   stores the file; it does not parse the PDF or create questions.
4. Add questions one at a time to the draft DPP. The backend assigns each
   question's chapter, owner, and next position.
5. Retrieve the DPP to inspect its questions and total marks.

There is currently no separate question-bank API, DPP update/delete/archive
endpoint, or DPP publish endpoint. Although the DPP schema has a `published`
status value, these routes create drafts and only add questions to drafts.

## Authentication and request conventions

All routes in this guide require teacher authentication. First log in through
`POST /auth/teacher/login` and retain the HTTP-only `token` cookie. Requests
must send that cookie; these routes do not document bearer-token
authentication. See [Authentication](./authentication.md).

JSON requests use `Content-Type: application/json`. Upload requests use
`multipart/form-data` with the uploaded file in the field named `file`.

For the examples below, replace IDs and cookie values with values from your
own environment. The course catalog can be populated with the seed command
described in [Course and subject seed data](#course-and-subject-seed-data).

## DPP data model

Each `DPP` document has these principal fields:

| Field | Meaning and constraints |
|---|---|
| `title` | Required, trimmed, 2–150 characters |
| `description` | Optional, trimmed, at most 2,000 characters; defaults to `""` |
| `instructions` | Optional, trimmed, at most 5,000 characters; defaults to `""` |
| `chapterId` | Required reference to the chapter; indexed |
| `questions` | Ordered question references; defaults to `[]` |
| `questions[].questionId` | Required reference to an existing `Question` |
| `questions[].order` | Required integer position, minimum `1` |
| `durationMinutes` | Required integer in requests; 1–600 minutes |
| `deadline` | Required date; the create endpoint requires a future date |
| `totalMarks` | Calculated by the backend from question correct marks; defaults to `0` |
| `creationMethod` | `MANUAL`, `PDF`, `IMAGE`, or `MIXED`; defaults to `MANUAL` |
| `status` | `draft` or `published`; new DPPs are `draft` |
| `createdBy` | Required teacher reference; set from authentication |
| `isArchived` | Soft-archive flag, default `false`; reads exclude archived records |
| timestamps | Mongoose supplies `createdAt` and `updatedAt` |

Question IDs and order values must be unique within a DPP. The create
controller additionally requires question order positions to be continuous:
`1, 2, ..., n`. The `DPP` model has indexes on chapter/status/deadline and
teacher/creation time.

The controller verifies that the chapter belongs to the logged-in teacher and
is not archived. Any questions supplied during initial DPP creation must be
active and belong to that chapter. The server calculates `totalMarks`; a
client-provided total is not accepted.

## DPP endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/teachers/dpps` | Create a draft DPP |
| `GET` | `/teachers/dpps` | List the teacher's non-archived DPPs |
| `GET` | `/teachers/dpps/:dppId` | Retrieve one owned, non-archived DPP with its chapter and populated questions |
| `PATCH` | `/teachers/dpps/:dppId` | Edit details on an owned draft |
| `POST` | `/teachers/dpps/:dppId/questions` | Create a question and append it to an owned draft |
| `PATCH` | `/teachers/dpps/:dppId/questions/:questionId` | Edit a question belonging to an owned draft |
| `DELETE` | `/teachers/dpps/:dppId/questions/:questionId` | Remove a question from an owned draft |
| `PATCH` | `/teachers/dpps/:dppId/questions/reorder` | Reorder every question in an owned draft |
| `PATCH` | `/teachers/dpps/:dppId/publish` | Publish an owned draft |

### Create a DPP

Required JSON fields are `title`, `chapterId`, `durationMinutes`, and
`deadline`. `questions` is optional and defaults to an empty array.
`description`, `instructions`, and `creationMethod` are optional.

```http
POST /teachers/dpps
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "title": "Physics DPP 01 - Kinematics",
  "description": "Practice on motion in one dimension.",
  "instructions": "Attempt all questions. Show your working.",
  "chapterId": "507f1f77bcf86cd799439011",
  "questions": [],
  "durationMinutes": 45,
  "deadline": "2027-01-01T12:00:00.000Z",
  "creationMethod": "MANUAL"
}
```

The request must have a valid chapter ObjectId owned by the teacher and a
future, parseable deadline. If questions are supplied, every item must be
`{"questionId":"<question-id>","order":1}` with a valid ObjectId and positive
integer order. IDs and order values cannot repeat, and the order sequence
must start at 1 without gaps. Referenced questions must be active and belong
to the selected chapter.

Success returns `201` with `status: "success"` and `data.dpp`. The new DPP is
always a draft, and `totalMarks` is set by the server. Invalid input returns
`400`; a chapter not found, archived, or not owned by the teacher returns
`404`; missing teacher authentication returns `401`.

### List and retrieve DPPs

`GET /teachers/dpps` returns `200`, a `results` count, and
`data.dpps`. Results are limited to the current teacher's non-archived DPPs,
sorted newest first. Each list result populates the chapter's `title` and
`subjectId`.

`GET /teachers/dpps/:dppId` returns `200` with `data.dpp`. It populates
chapter `title` and `subjectId`, plus each question's text, type, options,
difficulty, subject, topic tags, marking, explanation, and image metadata.
An invalid DPP ID returns `400`; a DPP that is missing, archived, or not
owned by the teacher returns `404`.

### Edit DPP details

`PATCH /teachers/dpps/:dppId` updates one or more of `title`, `description`,
`instructions`, `durationMinutes`, `deadline`, or `creationMethod`. The route
does not permit changing `chapterId`, `createdBy`, `questions`, `totalMarks`,
`status`, or `isArchived`; those values are controlled by the server or
separate endpoints. Updates are allowed only while the DPP is a non-archived
draft.

```http
PATCH /teachers/dpps/64f1c5d2b7b4a1234567890a
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "title": "Physics DPP 01 - Motion",
  "durationMinutes": 60,
  "deadline": "2027-02-01T12:00:00.000Z"
}
```

The same field constraints as creation apply: title is 2–150 characters,
description at most 2,000 characters, instructions at most 5,000 characters,
duration an integer from 1–600, deadline a future date, and creation method
one of `MANUAL`, `PDF`, `IMAGE`, or `MIXED`. The body must contain at least
one supported field. Success returns `200` with `data.dpp`; invalid input
returns `400`, and a missing/non-owned/non-draft DPP returns `404`.

### Add a question to a draft

`POST /teachers/dpps/:dppId/questions` accepts the question fields described
in [Question types and payloads](#question-types-and-payloads). The controller
uses an allowlist of question fields. It ignores client-supplied
`chapterId`/`createdBy` values and sets both from the DPP and authenticated
teacher. The question subject must match the chapter subject when the
chapter's subject name/code is recognized as Physics, Chemistry, or
Mathematics.

The question is appended at one greater than the current highest order. The
server recalculates the DPP total from all active questions' `marking.correctMarks`
(using 4 if a value is absent). If saving the DPP fails after the question
was created, the controller attempts to delete that new question.

Example of a multiple-correct question with partial marking:

```http
POST /teachers/dpps/64f1c5d2b7b4a1234567890a/questions
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "questionText": "Which quantities are vectors?",
  "questionType": "MULTIPLE_CORRECT",
  "options": [
    { "key": "A", "text": "Displacement" },
    { "key": "B", "text": "Speed" },
    { "key": "C", "text": "Velocity" },
    { "key": "D", "text": "Distance" }
  ],
  "correctOptions": ["A", "C"],
  "difficulty": "EASY",
  "subject": "PHYSICS",
  "topicTags": ["vectors", "kinematics"],
  "explanation": "Displacement and velocity have magnitude and direction.",
  "marking": {
    "correctMarks": 4,
    "incorrectMarks": -1,
    "unattemptedMarks": 0,
    "partialMarkingRules": [
      { "selectedOptions": ["A"], "marks": 2 },
      { "selectedOptions": ["C"], "marks": 2 }
    ]
  }
}
```

Success returns `201`, the created `question`, its assigned `order`, and the
updated `totalMarks`. Validation errors return `400` with an `errors` array.
An invalid DPP ID returns `400`; a missing, archived, non-owned, or
non-draft DPP returns `404`.

### Edit a question

`PATCH /teachers/dpps/:dppId/questions/:questionId` accepts one or more
question fields from the add-question payload. The question must already
belong to the DPP and must be active in its chapter. The server ignores
client-supplied `chapterId` and `createdBy`, checks the updated question
against the DPP chapter subject, and validates the merged question so omitted
fields retain their existing values. Because the Question document is shared,
editing it changes the question anywhere else it is referenced. The DPP's
`totalMarks` is recalculated after a successful update.

```http
PATCH /teachers/dpps/64f1c5d2b7b4a1234567890a/questions/64f1c5d2b7b4a1234567890b
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "difficulty": "HARD",
  "marking": {
    "correctMarks": 5,
    "incorrectMarks": -2,
    "unattemptedMarks": 0
  }
}
```

The route returns `200` with the updated question, its order, and the updated
total marks. Invalid question data returns `400`; an invalid ID returns
`400`; a missing/non-owned/non-draft DPP or question not in that DPP returns
`404`.

### Remove a question

`DELETE /teachers/dpps/:dppId/questions/:questionId` removes the question
reference from an owned draft and compacts the remaining `order` values to
`1..n`. It recalculates `totalMarks` and returns the new question references
and total. The Question document itself is **not deleted**: questions may be
referenced elsewhere, and this operation only removes the association with
this DPP.

The endpoint returns `200` on success, `400` for invalid IDs, and `404` if
the DPP is not an owned draft or the question is not part of it.

### Reorder questions

`PATCH /teachers/dpps/:dppId/questions/reorder` accepts the complete set of
DPP question references as `{ "questions": [{ "questionId": "...", "order": 1 }] }`.
Each current DPP question must appear exactly once, with unique contiguous
orders starting at 1. No question can be added or removed through this
endpoint.

```http
PATCH /teachers/dpps/64f1c5d2b7b4a1234567890a/questions/reorder
Content-Type: application/json
Cookie: token=<teacher-jwt>

{
  "questions": [
    { "questionId": "64f1c5d2b7b4a1234567890c", "order": 1 },
    { "questionId": "64f1c5d2b7b4a1234567890b", "order": 2 }
  ]
}
```

The endpoint returns `200` with the updated question order. Missing, extra,
duplicate, or invalid references and non-contiguous order numbers return
`400`; only an owned, non-archived draft can be reordered.

### Publish a DPP

`PATCH /teachers/dpps/:dppId/publish` publishes a DPP owned by the
authenticated teacher. The DPP must be a non-archived draft with at least one
question, a future deadline, and an active non-archived chapter still owned
by the teacher. Every referenced question must still be active and belong to
that chapter. Before changing status to `published`, the server recalculates
`totalMarks` from the saved question documents.

```http
PATCH /teachers/dpps/64f1c5d2b7b4a1234567890a/publish
Cookie: token=<teacher-jwt>
```

Success returns `200` with the published DPP. Invalid ID returns `400`;
missing or inaccessible DPP returns `404`; an empty DPP, expired deadline,
unavailable chapter, invalid question reference, or attempt to publish
anything other than a draft returns `400`.

## Question types and payloads

The shared `Question` model supports three exact `questionType` values:

| Type | Required answer fields | Option rules |
|---|---|---|
| `SINGLE_CORRECT` | Exactly one `correctOptions` key | At least two options |
| `MULTIPLE_CORRECT` | One or more `correctOptions` keys | At least two options; partial-marking rules are permitted |
| `NUMERICAL` | Finite numeric `numericalAnswer` | No options or correct-option keys |

All questions require non-empty `questionText`, a `difficulty` of `EASY`,
`MEDIUM`, or `HARD`, and a `subject` of `PHYSICS`, `CHEMISTRY`, or
`MATHEMATICS`. `chapterId` is derived by the endpoint. Optional `topicTags`
must be an array of non-empty strings; optional `explanation` must be a
string.

Every MCQ option must contain a non-empty `key` and `text`; option keys must
be unique. Every correct key must refer to an existing option, correct keys
must not repeat, and single-correct questions must have exactly one. For
numerical questions, `numericalTolerance` is optional and must be a finite,
non-negative number.

The `marking` object defaults to `correctMarks: 4`, `incorrectMarks: -1`, and
`unattemptedMarks: 0`. Supplied marks must be finite numbers. Optional
`partialMarkingRules` must be an array and may only be used for
`MULTIPLE_CORRECT`; each rule has a `selectedOptions` array and finite
`marks`. The selected option keys must exist and cannot repeat within one
rule.

Question images are optional. If provided, the image must be an object with a
valid HTTPS `url`; optional `altText` must be a string of at most 250
characters. The image model also stores optional `fileId` and `filePath`.

### Numerical question example

```json
{
  "questionText": "A body travels 20 m in 4 s. What is its average speed?",
  "questionType": "NUMERICAL",
  "numericalAnswer": 5,
  "numericalTolerance": 0.01,
  "difficulty": "EASY",
  "subject": "PHYSICS",
  "topicTags": ["motion"],
  "marking": {
    "correctMarks": 4,
    "incorrectMarks": -1,
    "unattemptedMarks": 0
  }
}
```

### Image-attached question

Upload the image first and copy its returned `url`, `fileId`, and `filePath`
into the question's `image` object. `altText` is optional and should describe
the meaningful content of the diagram for accessibility.

```json
{
  "questionText": "Find the equivalent resistance in the circuit.",
  "questionType": "SINGLE_CORRECT",
  "options": [
    { "key": "A", "text": "2 ohms" },
    { "key": "B", "text": "4 ohms" }
  ],
  "correctOptions": ["B"],
  "difficulty": "MEDIUM",
  "subject": "PHYSICS",
  "image": {
    "url": "https://ik.imagekit.io/example/question-images/circuit.png",
    "fileId": "<imagekit-file-id>",
    "filePath": "/edupilot/question-images/circuit.png",
    "altText": "Circuit with two resistors connected in parallel"
  }
}
```

## File uploads

Both upload routes require teacher authentication and accept exactly one
multipart file in the field named `file`. Multer keeps the upload in memory
while the controller validates it and sends it to ImageKit.

| Route | Accepted MIME types | Maximum size | Storage folder |
|---|---|---:|---|
| `POST /teachers/uploads/pdf` | `application/pdf` | 20 MB | `/edupilot/question-pdfs` |
| `POST /teachers/uploads/image` | `image/jpeg`, `image/png`, `image/webp` | 10 MB | `/edupilot/question-images` |

The middleware checks MIME type and size. The controllers additionally check
the file's signature: `%PDF-` for PDFs and matching JPEG, PNG, or WebP
signatures for images. Uploads return `201` with `data.file`, containing
ImageKit metadata such as `fileId`, `name`, `url`, `filePath`, `size`, and
`fileType`.

Example PDF upload:

```bash
curl -i -X POST http://localhost:3000/teachers/uploads/pdf \
  -b cookies.txt \
  -F "file=@./practice-set.pdf;type=application/pdf"
```

Example image upload:

```bash
curl -i -X POST http://localhost:3000/teachers/uploads/image \
  -b cookies.txt \
  -F "file=@./circuit.png;type=image/png"
```

The uploaded original filename is not used as a path. The PDF endpoint
sanitizes its base name and caps it at 80 characters; ImageKit is configured
to use a unique file name. Uploading does not attach the file to a question:
the client must submit the image metadata in the question request.

`backend/middleware/upload.middleware.js` also exports a video uploader
(MP4/WebM/QuickTime, maximum 100 MB), but no video route is currently
registered. It is not an available API.

### ImageKit configuration

Uploads require the ImageKit credentials read from the environment:

```dotenv
IMAGEKIT_PUBLIC_KEY=<ImageKit public key>
IMAGEKIT_PRIVATE_KEY=<ImageKit private key>
IMAGEKIT_URL_ENDPOINT=<ImageKit URL endpoint>
```

Do not commit real values. The configuration is in
`backend/config/imagekit.js`; see [Environment variables](./environment-variables.md).
An ImageKit failure is logged by the server and returned as `502` with a
generic upload-failed message.

## Course and subject seed data

From `backend/`, run:

```bash
node seed/seedCourses.js
```

The script upserts `JEE Class 11` and `JEE Class 12`, then upserts Physics,
Chemistry, and Mathematics for each course. Courses are matched by
`classLevel`; subjects are matched by `courseId` and `code`. The script sets
these records active and does not remove other catalog records. It requires
the database configuration in `MONGODB_URI`.

The shared database helper does not return/await the connection promise, so
the script does not guarantee that the connection is ready before its first
upsert. If seeding reports connection or buffering errors, confirm MongoDB is
reachable and rerun after the connection is available. See
[Troubleshooting](./troubleshooting.md#dpp-question-and-upload-troubleshooting).

## Running the relevant tests

From `backend/`:

```bash
npm test
```

For a focused run:

```bash
node --test test/dpp.model.test.js test/questionValidation.test.js
```

These tests use Node's built-in test runner and do not save to MongoDB. They
cover DPP schema validation/defaults and representative question-validation
cases. They do not exercise controllers, cookies, database ownership queries,
ImageKit, actual uploads, or a complete student attempt.
See [Testing](./testing.md) for the current test scope.

## Troubleshooting

| Symptom | Likely cause | What to check |
|---|---|---|
| DPP/question endpoint returns `401` | Missing or invalid teacher `token` cookie | Log in as a teacher and preserve/send the cookie; see [Authentication](./authentication.md) |
| Endpoint returns `403` | Cookie token has the wrong role | Use a teacher account, not a student account |
| Create DPP returns `400` for deadline | Missing, malformed, or non-future date | Send an ISO-8601 date later than the server's current time |
| Create DPP returns `400` for questions | Duplicate IDs/orders, non-contiguous order, invalid IDs, or questions inactive/outside the chapter | Use unique active question IDs from the selected chapter and orders `1..n` |
| Create DPP returns chapter `404` | Chapter is missing, archived, or belongs to another teacher | Select a non-archived chapter owned by the logged-in teacher |
| Add-question returns `404` | DPP is missing, archived, not owned by the teacher, or no longer a draft | Fetch the teacher's DPP list and use an owned draft |
| Question returns validation errors | Wrong enum spelling/case, missing answer, invalid option key, or inconsistent question type fields | Compare the payload against [Question types and payloads](#question-types-and-payloads); errors are returned in `errors` |
| Question subject is rejected | `subject` differs from the DPP chapter's recognized subject | Match `PHYSICS`, `CHEMISTRY`, or `MATHEMATICS` to the chapter |
| Upload returns `413` | File exceeds its per-type maximum or more than one file was sent | Use one `file` field and stay within 20 MB (PDF) or 10 MB (image) |
| Upload returns `400` | Unsupported MIME type, missing file, or MIME/signature mismatch | Send the right file field and supported type; make sure the file content actually matches its extension |
| Upload returns `502` | ImageKit request/configuration failure | Verify `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT`, then inspect server logs |
| Upload succeeds but question image is missing | Upload and question creation are separate operations | Include the upload response's HTTPS `url`, `fileId`, and `filePath` in the question `image` object |
| Course seed fails | MongoDB settings/network issue or seed query ran before connection readiness | Check `MONGODB_URI`, MongoDB availability, and server/seed output; retry after connectivity is restored |

## Related guides

- [API reference](./api-reference.md#dpp-question-creation-and-optional-images)
- [Database models](./database.md)
- [Authentication](./authentication.md)
- [Environment variables](./environment-variables.md)
- [Testing](./testing.md)
- [Troubleshooting](./troubleshooting.md)
