# AMIT ACADEMY — Student and Teacher Web Platform

> **"Learn with purpose. Master with confidence."**

AMIT ACADEMY is an AI-powered learning and JEE preparation platform built with **React 19 + Vite + TypeScript**, styled with **Tailwind CSS v4** and styled around the **Cinematic Academic Luxury** brand identity.

---

## 1. Brand Identity & Design System

### Exact Brand Palette
```css
:root {
  --brand-ivory:    #E3DDD3; /* Warm reading surface */
  --brand-white:    #F7F5F3; /* Soft background */
  --brand-amber:    #F7A51B; /* Primary call-to-action */
  --brand-gold:     #E1B270; /* Secondary emphasis / accents */
  --brand-crimson:  #B52D36; /* High-priority / alert states */
  --brand-burgundy: #7D1830; /* Academic hero / teacher workspace */
  --brand-earth:    #624133; /* Grounding neutral / typography */
  --brand-cherry:   #190307; /* Dark exam environment */
}
```

### Typography Hierarchy
- **Display Headings:** Space Grotesk / Manrope (`font-display`)
- **Body & Data:** Inter / DM Sans (`font-body`)
- **Mathematics:** KaTeX inline (`$...$`) and display (`$$...$$`) rendering

---

## 2. API Integration Matrix

| Feature / Screen | Actual Backend Endpoint | Method | Auth Required | Request Payload | Response Shape | Status |
|---|---|---|---|---|---|---|
| **Student Register** | `/auth/student/register` | `POST` | None | `{ firstName, lastName, email, password }` | `{ message, user: { _id, email, name, role } }` | Connected & Verified |
| **Student Login** | `/auth/student/login` | `POST` | None | `{ email, password }` | `{ message, user }` (sets `token` cookie) | Connected & Verified |
| **Student Logout** | `/auth/student/logout` | `POST` | Student | None | `{ message }` (clears cookie) | Connected & Verified |
| **Teacher Register** | `/auth/teacher/register` | `POST` | None | `{ firstName, lastName, email, password }` | `{ message, user }` | Connected & Verified |
| **Teacher Login** | `/auth/teacher/login` | `POST` | None | `{ email, password }` | `{ message, user }` | Connected & Verified |
| **Teacher Logout** | `/auth/teacher/logout` | `POST` | Teacher | None | `{ message }` | Connected & Verified |
| **Student Dashboard** | `/students/dashboard` | `GET` | Student | None | `{ status, data: { profile, summary, courseOverview } }` | Connected & Verified |
| **Student Enroll Course** | `/students/enrollments` | `POST` | Student | `{ courseId }` | `{ status, message, data: { enrollmentId, course } }` | Connected & Verified |
| **Student My Enrollments** | `/students/enrollments` | `GET` | Student | None | `{ status, count, data: [ { enrollmentId, course } ] }` | Connected & Verified |
| **Student Chapter Lessons** | `/students/lessons/chapter/:chapterId` | `GET` | Student | None | `{ status, count, data: [ Lesson ] }` | Connected & Verified |
| **Student DPP List** | `/students/dpps` | `GET` | Student | None | `{ count, data: [ DPP ] }` | Connected & Verified |
| **Start DPP Attempt** | `/students/dpps/:dppId/attempts` | `POST` | Student | `{ mode: 'PRACTICE' \| 'EXAM' }` | `{ message, data: { attemptId, deadline, questions } }` | Connected & Verified |
| **Save Answer** | `/students/dpps/attempts/:attemptId/answers` | `PATCH` | Student | `{ questionId, selectedOptions, numericalAnswer, markedForReview }` | `{ message, data: { questionId, saved } }` | Connected & Verified |
| **Submit Attempt** | `/students/dpps/attempts/:attemptId/submit` | `POST` | Student | None | `{ message, data: { attemptId, score, accuracy, topicReport } }` | Connected & Verified |
| **Attempt Result** | `/students/dpps/attempts/:attemptId` | `GET` | Student | None | `{ data: Attempt & { review? } }` | Connected & Verified |
| **Attempt History** | `/students/dpps/attempts` | `GET` | Student | None | `{ count, data: [ Attempt ] }` | Connected & Verified |
| **Teacher Profile** | `/teachers/me` | `GET` | Teacher | None | `{ status, data: Teacher }` | Connected & Verified |
| **Update Teacher Profile** | `/teachers/update` | `PATCH` | Teacher | `{ firstName?, lastName?, email?, password? }` | `{ status, data: Teacher }` | Connected & Verified |
| **Teacher Chapters List** | `/teachers/chapters` | `GET` | Teacher | None | `{ status, count, data: [ Chapter ] }` | Connected & Verified |
| **Create Chapter** | `/teachers/chapters` | `POST` | Teacher | `{ title, description?, subjectId, order }` | `{ status, data: Chapter }` | Connected & Verified |
| **Update Chapter** | `/teachers/chapters/:id` | `PATCH` | Teacher | `{ title?, description?, order?, status? }` | `{ status, data: Chapter }` | Connected & Verified |
| **Archive Chapter** | `/teachers/chapters/:id` | `DELETE` | Teacher | None | `{ status, message }` | Connected & Verified |
| **Teacher Lessons List** | `/teachers/lessons` | `GET` | Teacher | Query params: `chapterId, search, status, page, limit` | `{ status, count, total, data: [ Lesson ] }` | Connected & Verified |
| **Create Lesson** | `/teachers/lessons` | `POST` | Teacher | `{ title, description, chapterId, order, duration, difficulty, topics }` | `{ status, data: Lesson }` | Connected & Verified |
| **Publish Lesson** | `/teachers/lessons/:id/publish` | `PATCH` | Teacher | None | `{ status, data: Lesson }` | Connected & Verified |
| **Unpublish Lesson** | `/teachers/lessons/:id/unpublish` | `PATCH` | Teacher | None | `{ status, data: Lesson }` | Connected & Verified |
| **Archive Lesson** | `/teachers/lessons/:id` | `DELETE` | Teacher | None | `{ status, message }` | Connected & Verified |
| **Teacher DPP List** | `/teachers/dpps` | `GET` | Teacher | None | `{ status, results, data: { dpps: [ DPP ] } }` | Connected & Verified |
| **Create DPP** | `/teachers/dpps` | `POST` | Teacher | `{ title, description?, chapterId, durationMinutes, deadline }` | `{ status, data: { dpp: DPP } }` | Connected & Verified |
| **Add Question to DPP** | `/teachers/dpps/:dppId/questions` | `POST` | Teacher | `{ questionText, questionType, options, correctOptions, marking }` | `{ status, data: { question, order, totalMarks } }` | Connected & Verified |
| **Remove Question** | `/teachers/dpps/:dppId/questions/:qid` | `DELETE` | Teacher | None | `{ status, message }` | Connected & Verified |
| **Publish DPP** | `/teachers/dpps/:dppId/publish` | `PATCH` | Teacher | None | `{ status, data: { dpp } }` | Connected & Verified |
| **Media Upload (PDF)** | `/teachers/uploads/pdf` | `POST` | Teacher | `FormData` (field: `file`) | `{ status, data: { url, fileId } }` | Connected & Verified |
| **Media Upload (Image)**| `/teachers/uploads/image`| `POST` | Teacher | `FormData` (field: `file`) | `{ status, data: { url, fileId } }` | Connected & Verified |
| **AI Question Suggest** | AI Service (`:8000`) | N/A | None | Pending AI implementation | Endpoints `/` and `/health` only | Documented Fallback |
| **Teacher Class Roster**| N/A | N/A | Teacher | No teacher-to-student cohort assignment schema in backend | N/A | Documented Fallback |

---

## 3. Project Structure

```
frontend/
├── .env                  # Configured with VITE_API_BASE_URL=http://localhost:3000
├── .env.example          # Environment variable reference
├── index.html            # Preloads Google Fonts (Space Grotesk, Inter) & KaTeX CSS
├── package.json          # Vite, React, TanStack Query, Framer Motion, KaTeX, Recharts
├── tsconfig.json         # Strict React 19 JSX & Vite TypeScript settings
├── vite.config.ts        # React and Tailwind v4 plugins
├── src/
│   ├── main.tsx          # Application mount
│   ├── App.tsx           # Route hierarchy & role guards
│   ├── index.css         # Tailwind v4 theme, brand colors, button styles
│   ├── vite-env.d.ts     # Ambient types
│   ├── api/
│   │   ├── client.ts     # Axios instance with credentials and 401 interception
│   │   └── index.ts      # Typed endpoints for Auth, Student, Teacher, DPPs, Uploads
│   ├── components/
│   │   ├── BrandEntrance.tsx   # First-visit orbital brand entrance animation
│   │   └── ProtectedRoute.tsx  # Role-based route guard
│   ├── contexts/
│   │   └── AuthContext.tsx     # Student & Teacher auth provider
│   ├── layouts/
│   │   ├── StudentLayout.tsx   # Student cherry sidebar & navigation
│   │   └── TeacherLayout.tsx   # Teacher burgundy studio sidebar
│   ├── pages/
│   │   ├── AuthPage.tsx        # Sign-in/Sign-up with role toggle & animations
│   │   ├── student/
│   │   │   ├── StudentHome.tsx       # Breakthrough hero, stats, course overview
│   │   │   ├── StudentLearning.tsx   # Curriculum explorer & course enrollment
│   │   │   ├── ChapterView.tsx       # Lessons list with media resources
│   │   │   ├── StudentPractice.tsx   # DPP listing with practice vs exam modes
│   │   │   ├── ExamPage.tsx          # Distraction-free JEE examination workspace
│   │   │   ├── ResultPage.tsx        # Score breakdown, radial accuracy, topic report
│   │   │   ├── StudentResults.tsx    # Submitted assessment history
│   │   │   └── StudentSettings.tsx   # Profile info, preferences, logout
│   │   └── teacher/
│   │       ├── TeacherHome.tsx       # Teaching studio dashboard
│   │       ├── TeacherChapters.tsx   # Chapter management & subject picker
│   │       ├── TeacherLessons.tsx    # Lesson authoring with ImageKit upload
│   │       ├── TeacherDPPs.tsx       # DPP builder & question authoring
│   │       └── TeacherSettings.tsx   # Teacher profile update & security
│   ├── test/
│   │   ├── api.test.ts         # Central client tests
│   │   ├── auth.test.ts        # Role routing tests
│   │   └── exam.test.ts        # Exam interaction & grading tolerance tests
│   └── types/
│       └── index.ts            # Strict TypeScript models matching backend Mongoose models
```

---

## 4. Setup & Running Instructions

### 1. Start the Backend Server
```powershell
cd c:\Users\Varad\Desktop\edupilot\backend
npm install
node server.js
# Backend runs at http://localhost:3000
```

### 2. Start the Frontend Application
```powershell
cd c:\Users\Varad\Desktop\edupilot\frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 3. Run Checks & Tests
```powershell
# Frontend TypeScript check
npx tsc --noEmit

# Frontend test suite
npx vitest run

# Frontend production build
npm run build

# Backend model and validation tests
cd ../backend
npm test
```
