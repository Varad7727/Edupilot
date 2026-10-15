# Environment Variables

This reference is based on `process.env` reads in backend source files. The
contents of any local `.env` file are intentionally not included.

| Name | Purpose | Required? | Verified default / behavior |
|---|---|---|---|
| `MONGODB_URI` | MongoDB connection string passed to `mongoose.connect()` | Required for database-backed operations | No fallback is defined |
| `JWT_SECRET` | Signs and verifies authentication JWTs | Required for registration/login and protected routes | No fallback is defined |
| `NODE_ENV` | Determines whether auth cookie has its `secure` flag enabled | Optional | Cookie is secure only when the value is exactly `"production"`; otherwise false |

`dotenv.config()` is called in `backend/server.js` and in
`backend/seed/seedCourses.js`, so variables can be loaded from the working
directory's `.env` file when those entry points run. `.env` and `.env.*` are
ignored by `backend/.gitignore`; there is no tracked `.env.example`.

Example placeholders (not defaults and not credentials):

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/edupilot
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
```

The application port is hard-coded as `3000` in `backend/server.js`; no
environment variable configures it.
