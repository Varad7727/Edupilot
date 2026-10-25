# Testing

## Test runner

The backend uses Node.js's built-in test runner. The `backend/package.json`
test script is `node --test`, so no separate test framework is required.

Run from the backend directory:

```bash
npm test
```

Or run a focused test file:

```bash
node --test test/questionValidation.test.js
node --test test/dpp.model.test.js
```

The current tests cover question payload validation and DPP Mongoose schema
validation. They do not require a live MongoDB connection because the model
tests call Mongoose validation without saving documents.

## Current coverage and next steps

- `test/questionValidation.test.js`: a valid single-correct question, missing
  single-correct answer, duplicate option keys, optional question image,
  valid HTTPS image, and rejection of a non-HTTPS image.
- `test/dpp.model.test.js`: valid DPP, missing title/chapter, duplicate
  question IDs/order positions, duration boundaries, draft/archive/creation
  defaults, and a draft with no questions.
- Not yet covered: HTTP/controller integration, authentication cookies,
  ownership checks against a database, upload behavior, and end-to-end student
  attempts.

A passing unit test suite is not a substitute for testing against an isolated
test database and exercising protected routes with real authentication.
For the full authoring workflow and payload examples, see
[DPP authoring](./dpp-authoring.md).
