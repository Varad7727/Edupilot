# Error Handling

## Current structure

The project has no centralized Express error-handling middleware. Most
controllers wrap operations in local `try/catch` blocks and directly return a
JSON response. Authentication middleware also catches token verification and
database lookup failures locally. Some endpoints log errors with
`console.error`; logging is inconsistent.

## Response conventions

Error payloads vary by feature:

- Catalog and teacher/chapter endpoints generally return
  `{"status":"failed","message":"..."}`.
- Authentication responses generally return `{"message":"..."}` and omit
  the `status` property.
- Registration validation may return `message: "Validation Error"` with an
  `errors` array.

Do not assume all errors share one response envelope.

## Status code conventions from current handlers

| Code | Current uses |
|---|---|
| `200` | Successful reads, updates, and logout |
| `201` | Successful registration or chapter creation |
| `400` | Invalid request fields/IDs; auth missing inputs or invalid credentials; registration duplicate email |
| `401` | Missing or invalid authentication cookie; token verification/database errors caught by auth middleware |
| `403` | Valid token with the wrong account role |
| `404` | Missing/inactive catalog record, missing teacher, or unavailable/non-owned chapter |
| `409` | Teacher profile email already belongs to another teacher |
| `500` | Caught unexpected controller or database error |

## Validation and database errors

- Account schema validation errors during registration are converted to
  `400` with an `errors` array.
- Registration handles MongoDB duplicate-key error code `11000` as `400`.
- Teacher profile update checks email collision explicitly and returns `409`;
  an index race not caught by that pre-check can fall through to `500`.
- Chapter order has a unique index per subject. Create/update controller
  catches are generic, and no dedicated duplicate-key-to-`409` mapping exists;
  a duplicate index violation can return `500`.
- The chapter PATCH controller currently has invalid description validation
  and an order condition that requires `order` on each PATCH. See
  [API reference](./api-reference.md#patch-teacherschapterschapterid).

## Logging and diagnostics

Some course, subject, teacher-update, and chapter controller failures log
messages to the server console. Auth failures and teacher profile read errors
are not consistently logged. The database helper logs connection success or
failure, but does not stop the server from listening when connection fails.
See [Troubleshooting](./troubleshooting.md).

## Error handling boundaries

There is no uniform request validation middleware, request ID, structured
logger, or shared error serializer in the current source. Express's default
error handling remains the fallback for errors that escape local catches.
