# Testing

## Current test setup

The backend `package.json` defines:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

There are no application test files or test framework in the backend tree.
Consequently, `npm test` is a placeholder and exits unsuccessfully; it does
not run a test suite. No test results or coverage are available to report.

## Verified commands

| Command | Result based on current configuration |
|---|---|
| `npm test` | Runs the placeholder above and exits with status 1 |
| `npm start` | Starts `nodemon server.js`; this is a development server command, not a test |

No lint, build, or coverage scripts are configured.

## Adding tests

No testing conventions exist yet in this repository. When a test framework is
introduced, add its dependency and scripts intentionally, then cover the
existing module boundaries:

- Controller behavior for request validation, status codes, and JSON response
  shapes.
- Route registration and middleware protection.
- Authentication role checks and cookie behavior.
- Mongoose model validation and unique-index behavior, using isolated test
  data rather than real user records.

Until a runner is selected and tests are added, do not describe the backend as
having a passing automated test suite.
