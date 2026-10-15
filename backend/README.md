# EduPilot Backend

The EduPilot backend provides account authentication, a public course and
subject catalog, and teacher profile and chapter APIs.

## Technology

- Node.js with CommonJS
- Express 5
- MongoDB with Mongoose
- JWT authentication in HTTP-only cookies
- bcrypt password hashing

## Prerequisites

- Node.js and npm (the repository does not pin a Node.js version)
- A MongoDB instance and connection URI
- A private JWT signing secret

## Quick start

Run these commands from the repository root:

```bash
cd backend
npm ci
```

Create a local `.env` file with the required configuration:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/edupilot
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
```

The MongoDB URI and secret above are placeholders, not project defaults.
Never commit secrets. See [Environment variables](./docs/environment-variables.md)
for verified usage.

Start the development server:

```bash
npm start
```

The server listens on port `3000`. The `start` script uses nodemon. MongoDB
connection setup is asynchronous and the server can listen before the
connection succeeds; check the startup log for connection status.

## Documentation

Start with the [documentation index](./docs/README.md).

- [Architecture](./docs/architecture.md)
- [Local setup](./docs/setup.md)
- [API reference](./docs/api-reference.md)
- [Database models](./docs/database.md)
- [Authentication](./docs/authentication.md)
- [Modules](./docs/modules.md)
- [Environment variables](./docs/environment-variables.md)
- [Error handling](./docs/error-handling.md)
- [Testing](./docs/testing.md)
- [Troubleshooting](./docs/troubleshooting.md)

`npm test` is currently a placeholder and exits unsuccessfully; there is no
configured test suite. See [Testing](./docs/testing.md).
