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

- Question validation: valid payloads, missing correct answer, duplicate
  option keys, numerical-answer requirements, invalid correct-option keys,
  numerical-option restrictions, numerical tolerance, and partial-marking rules.
- DPP schema: required fields, duplicate question IDs/order values, duration
  bounds, and default draft state.
- Not yet covered: HTTP/controller integration, authentication cookies,
  ownership checks against a database, upload behavior, and end-to-end student
  attempts.

A passing unit test suite is not a substitute for testing against an isolated
test database and exercising protected routes with real authentication.
