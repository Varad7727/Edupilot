# Troubleshooting

## Server does not start

- **Symptom:** `npm start` fails or exits.
- **Likely cause:** Dependencies are not installed, Node.js cannot run the
  installed package versions, or port `3000` is already occupied.
- **How to verify:** Run `npm ci`, inspect the terminal error, and check
  whether another process is listening on `3000`.
- **Recommended fix:** Install using the committed lock file; stop or
  reconfigure the conflicting process. The backend currently hard-codes
  port `3000`; see [Local setup](./setup.md).

## Database connection failures

- **Symptom:** The server listens but database-backed API calls fail; startup
  logs `MongoDB connection error:`.
- **Likely cause:** `MONGODB_URI` is missing/invalid, MongoDB is unavailable,
  or the database rejects the connection.
- **How to verify:** Confirm the environment variable is set without printing
  it into shared logs, confirm MongoDB reachability, and inspect startup logs
  for `MongoDB connected!!!` or the error message.
- **Recommended fix:** Correct the local configuration and ensure MongoDB is
  running/reachable. The server does not wait for a successful connection
  before listening; see [Architecture](./architecture.md#startup-behavior).

## Course seed fails or runs before MongoDB is ready

- **Symptom:** Running `node seed/seedCourses.js` reports query buffering,
  connection, or upsert failures.
- **Likely cause:** Missing database configuration or the connection helper
  not returning/awaiting the `mongoose.connect()` promise.
- **How to verify:** Check the helper in `backend/db/db.js` and confirm
  `MONGODB_URI` is configured.
- **Recommended fix:** Wait until MongoDB is available and inspect the seed
  output. The current seed/connection implementation does not guarantee
  connection readiness before queries; see [Local setup](./setup.md#seed-the-course-catalog).

## Protected route returns 401

- **Symptom:** A teacher/student route returns `401`.
- **Likely cause:** Missing, expired, malformed, or unverifiable `token`
  cookie; missing or inconsistent `JWT_SECRET`; or an account lookup failure
  caught by middleware as an invalid token.
- **How to verify:** Log in again and confirm the client sends the cookie.
  Check that the same secret is set when issuing and verifying JWTs.
- **Recommended fix:** Use cookie-aware requests (for curl, `-c cookies.txt`
  on login and `-b cookies.txt` on later calls) and verify environment
  configuration; see [Authentication](./authentication.md).

## Protected route returns 403

- **Symptom:** The token is accepted but the route returns `403`.
- **Likely cause:** The JWT's role does not match the protected route.
- **How to verify:** Log in using the correct account type for the endpoint.
- **Recommended fix:** Use a student token for student logout and a teacher
  token for teacher/profile/chapter endpoints; see
  [Authentication](./authentication.md#protected-routes).

## Browser does not send authentication cookie cross-origin

- **Symptom:** Login works but a later browser request is unauthenticated.
- **Likely cause:** The cookie is `SameSite=Strict`, and Express CORS is
  installed with default options rather than explicit credential settings.
- **How to verify:** Inspect browser cookie/network diagnostics and compare
  frontend and backend origins.
- **Recommended fix:** Confirm deployment origin and cookie policy with the
  application owner. Cross-origin credential behavior is not configured by
  the current backend; see [Authentication](./authentication.md#security-and-implementation-notes).

## Chapter PATCH returns 400 without an order field

- **Symptom:** A chapter PATCH omitting `order` fails validation.
- **Likely cause:** The current order condition executes validation for every
  request.
- **How to verify:** Inspect `updateChapter` in
  `backend/controller/chapter.controller.js`.
- **Recommended fix:** As a temporary workaround, send a valid positive
  integer `order` with every PATCH. See the current behavior in the
  [API reference](./api-reference.md#patch-teacherschapterschapterid).

## Chapter PATCH with description returns 500

- **Symptom:** Adding `description` to a chapter PATCH causes an internal
  server error.
- **Likely cause:** The controller calls `description.length()` and checks
  `typeof title` in the description validation branch.
- **How to verify:** Review the description branch in `updateChapter`.
- **Recommended fix:** Avoid sending `description` until the application
  implementation is corrected; this documentation does not modify runtime
  behavior. See [API reference](./api-reference.md#patch-teacherschapterschapterid).

## Chapter creation reports an unexpected server error

- **Symptom:** A valid-looking chapter creation returns `500`.
- **Likely cause:** A MongoDB constraint failed, such as reusing an `order`
  already assigned within that subject, or another unexpected database
  failure.
- **How to verify:** Check server logs and confirm that the subject has no
  existing chapter at the requested order.
- **Recommended fix:** Choose an unused order for the subject. The unique
  index is documented in [Database](./database.md#chapter).

## `npm test` fails

- **Symptom:** `npm test` exits with `Error: no test specified`.
- **Likely cause:** The package script is intentionally a placeholder; no test
  framework or application tests are configured.
- **How to verify:** Inspect the `test` script in `backend/package.json`.
- **Recommended fix:** This is not a runtime regression. See
  [Testing](./testing.md) for the current status.
