# Backend Documentation

Use this index to find implementation, setup, API, and operational guidance
for the EduPilot backend.

| Topic | What it covers | Guide |
|---|---|---|
| Architecture | Startup, request flow, module responsibilities, and database connection | [Architecture](./architecture.md) |
| Local setup | Requirements, installation, environment configuration, database, startup, and seed command | [Setup](./setup.md) |
| API reference | Exact mounted routes, inputs, responses, and current validation behavior | [API reference](./api-reference.md) |
| DPP authoring | DPP/question schemas, teacher workflow, examples, uploads, seed data, and troubleshooting | [DPP authoring](./dpp-authoring.md) |
| Database | Mongoose models, fields, relations, defaults, constraints, and indexes | [Database](./database.md) |
| Authentication | Registration/login, password hashing, JWT cookies, middleware, and logout | [Authentication](./authentication.md) |
| Modules | Source-file map for controllers, routes, models, middleware, and startup | [Modules](./modules.md) |
| Environment variables | Verified runtime environment variable names and behavior | [Environment variables](./environment-variables.md) |
| Error handling | Error response conventions, validation, database failures, and logging | [Error handling](./error-handling.md) |
| Testing | Existing test configuration and verified commands | [Testing](./testing.md) |
| Troubleshooting | Common setup, database, authentication, validation, and API diagnostics | [Troubleshooting](./troubleshooting.md) |

## Start here

- New to the backend? Begin with [Local setup](./setup.md), then read
  [Architecture](./architecture.md).
- Implementing or calling an endpoint? Use the [API reference](./api-reference.md)
  and [Authentication](./authentication.md).
- Working on teacher DPPs, questions, or file uploads? Start with
  [DPP authoring](./dpp-authoring.md).
- Changing a schema? Consult [Database](./database.md).
- Diagnosing a failure? Start with [Troubleshooting](./troubleshooting.md)
  and [Error handling](./error-handling.md).

The concise backend entry point is [../README.md](../README.md). There is no
repository-root README in the current checkout.
