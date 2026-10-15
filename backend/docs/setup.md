# Local Backend Setup

## Prerequisites

- Node.js and npm. The repository does not declare a required Node.js version.
- A reachable MongoDB deployment or local MongoDB instance.
- A MongoDB connection URI and a private JWT signing secret.

Use a currently supported Node.js release compatible with the installed
dependencies. The package manifest does not specify an `engines` range, so no
specific version can be claimed as project-verified.

## Install dependencies

From the backend directory:

```bash
cd backend
npm ci
```

`npm ci` uses the committed `package-lock.json` to install the locked
dependencies.

## Configure environment

Create a local `backend/.env` file (it is ignored by Git) and set the
environment variables listed in [Environment variables](./environment-variables.md).
Do not commit credentials. No `.env.example` is present in the current
backend.

Example with placeholders only:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/edupilot
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
```

The local MongoDB URI above is an example, not a configured project default.
The backend reads `MONGODB_URI`; it does not provide a fallback URI.

## Start the server

From `backend/`:

```bash
npm start
```

The `start` script runs `nodemon server.js`. `server.js` loads `.env` and
listens on port `3000`. The port is hard-coded; there is no `PORT` setting in
the current source.

The server starts listening even if the asynchronous MongoDB connection has
not succeeded. Check startup output for `MongoDB connected!!!` or
`MongoDB connection error:` before relying on database-backed routes.

## Seed the course catalog

The seed script is present at `backend/seed/seedCourses.js`; it is not exposed
as an npm script. From `backend/`:

```bash
node seed/seedCourses.js
```

It upserts courses for class levels 11 and 12 and Physics, Chemistry, and
Mathematics subjects for each course. It resets those seed records to active.
The script calls the shared connection helper, but that helper does not
return/await the MongoDB connection promise; connection readiness before seed
queries is therefore not guaranteed by the current implementation.

## Package scripts

| Command | Current behavior |
|---|---|
| `npm start` | Runs `nodemon server.js` |
| `npm test` | Placeholder that prints `Error: no test specified` and exits unsuccessfully |

There is no declared lint, build, migration, or test-runner script. See
[Testing](./testing.md) for the verified test status.

## Common setup problems

- **Missing MongoDB connection:** verify `MONGODB_URI`, network access, and
  MongoDB availability; see [Troubleshooting](./troubleshooting.md).
- **JWT failures:** set `JWT_SECRET` before starting the server and keep it
  consistent between token creation and verification.
- **Port already in use:** the server listens on fixed port `3000`; the
  current application does not read a port environment variable.
- **Seed runs before connection:** check the database log and retry only after
  the connection is established; the helper's current promise handling does
  not guarantee this ordering.
