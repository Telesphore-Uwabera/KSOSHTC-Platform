# KSOHTC Platform

Production-ready full-stack React app with Express backend: React Router 6 SPA, TypeScript, Vite, TailwindCSS, Firebase Firestore. Only add API endpoints when necessary (e.g. private keys, DB operations).

---

## Tech stack

- **PNPM** – package manager
- **Frontend** – React 18, React Router 6, TypeScript, Vite, TailwindCSS 3, Radix UI, Lucide React
- **Backend** – Express, Firebase Admin (Firestore)
- **Testing** – Vitest

---

## Project structure

```
clients/          # React SPA
├── pages/        # Route components (Index = home, admin/* = admin)
├── components/ui/
├── App.tsx
└── global.css

backend/          # Express API
├── index.ts      # Loads .env from root and backend/.env
├── lib/          # Firestore, etc.
└── routes/

shared/api.ts     # Shared types
```

**Storage:** Firestore holds all dynamic data (see [Database (Firestore)](#database-firestore) below). Set `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT` in `.env` (see `.env.example`).

---

## Pages and backend data

All pages that need dynamic data call the backend API; the backend reads/writes Firestore.

| Page | Route | Backend API / data |
|------|--------|---------------------|
| **Home** | `/` | `GET /api/testimonials`; contact form `POST /api/contact` (name, email, phone, message) |
| **About** | `/about` | Static content |
| **Programs** | `/programs` | Static content |
| **Industries** | `/industries` | Static content |
| **Contact** | `/contact` | `POST /api/contact` (saves inquiries to Firestore; name, email, phone, message required) |
| **Terms & Conditions** | `/terms` | Static content |
| **Privacy Policy** | `/privacy` | Static content |
| **Cookie Policy** | `/cookies` | Static content |
| **Courses** | `/courses` | `GET /api/course-content/courses`, `GET /api/course-content/courses-from-public` |
| **Course detail** | `/courses/:courseId` | Course content, modules, lessons, progress, enrollments, resolve-pdf |
| **Login** | `/login` | `POST /api/login` (users) |
| **Register** | `/register` | `POST /api/register` (users) |
| **Dashboard** (learner) | `/dashboard`, `/dashboard/courses`, `/dashboard/progress`, `/dashboard/settings` | `GET /api/course-content/courses`, `GET /api/progress`, course stats |
| **Take quiz** | `/courses/:courseId/quiz/take` | `GET /api/courses/:courseId/quiz`, course content |
| **Module quiz** | `/courses/:courseId/modules/:moduleId/quiz/:assessmentId` | Course content, assessments, submit |
| **Admin login** | `/admin/login` | `POST /api/login` (users) |
| **Admin dashboard** | `/admin` | `GET /api/analytics/course-usage`, users, testimonials, courses, quizzes |
| **Admin courses** | `/admin/courses` | `GET /api/courses`, `GET/PUT/DELETE /api/courses/:courseId/quiz` |
| **Admin course content** | `/admin/course-content`, `/admin/course-content/:courseId`, etc. | `GET/POST/PUT/DELETE /api/course-content/*`, seed/clean |
| **Admin learners** | `/admin/learners` | `GET /api/users/learners-summary`, users, enrollments, approve, CRUD |
| **Admin testimonials** | `/admin/testimonials` | `GET/POST /api/testimonials` |
| **Admin settings** | `/admin/settings` | Logout only (no API) |

---

## Database (Firestore)

Collections used by the backend (all access via Admin SDK; no client direct access):

| Collection | Purpose |
|------------|---------|
| **users** | Registrations, login, approval, sector; name, email, phone (required), organization; passwords stored as bcrypt hashes (plain-text fallback for legacy users) |
| **testimonials** | Home page “What Our Participants Say”; admin-managed |
| **quizzes** | Per-course legacy quiz (admin editable) |
| **courses** | Course metadata, modules, lessons, assessments (course content) |
| **enrollments** | Learner enrollment in courses; status (active/completed) |
| **submissions** | Quiz/assessment submissions |
| **progress** | Per-user, per-course: completed lessons, passed assessments |
| **inquiries** | Contact form submissions (name, email, phone, message, createdAt) |

---

## Development

```bash
pnpm dev          # Client + server (single port 8080)
pnpm dev:backend  # Backend only on :8085
pnpm dev:frontend  # Frontend only
pnpm build        # Production build
pnpm start        # Production server
pnpm typecheck
pnpm test
```

- **API prefix:** `/api/`
- **Backend:** Run from project root; do not run `pnpm dev` from inside `backend/` (that runs Vite). Backend logs each request (method, path, status, duration).

---

## Environment

- **Root:** `.env` at project root (see `.env.example`).
- **Backend:** Also reads `backend/.env` if present. Use for Firebase credentials, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_URL` (CORS), etc.

### Admin email notifications (optional)

When someone **registers** or submits the **Contact** form (including from the **Home** page contact section), data is saved to Firestore. Optionally:

- **Admin** receives an email with registrant/contact details (name, email, phone, etc.). Set SMTP in `backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and optionally `SMTP_FROM`, `SMTP_SECURE`). Example: Gmail with an [App Password](https://support.google.com/accounts/answer/185833). Notifications go to `ADMIN_EMAIL`. If SMTP is not set, no email is sent (Firestore still saves).
- **Learner** receives an email when their account is **approved** (same SMTP config). Approval happens via Admin → Learners (approve) or when admin sets approved to true on edit.

### Netlify form detection (optional)

The backend can POST a copy of registration and contact submissions to your Netlify site so they appear in **Netlify Forms**. Hidden forms in `index.html` (`name="registration"` and `name="contact"`) with `data-netlify="true"` are required; the backend uses `FRONTEND_URL` (or `NETLIFY_FORM_SUBMIT_URL`) to POST. Firestore remains the source of truth.

---

## Firebase

### Firestore rules (CLI)

Rules live in **`firestore.rules`** (deny client access; backend uses Admin SDK).

1. Install CLI: `pnpm add -D firebase-tools`
2. Login: `pnpm exec firebase login`
3. Project: `.firebaserc` uses `ksohtc-188e5`; change with `pnpm exec firebase use <project-id>`
4. Deploy rules: `pnpm run firebase:deploy-rules` or `pnpm exec firebase deploy --only firestore:rules`

---

## Courses (Firestore)

Course list and content (modules, lessons, assessments) are in Firestore; served at `/api/course-content/*`. Public **Courses** and **Course detail** pages use these APIs.

### Where courses and PDFs live

- **Firestore** stores course **metadata** only: course list, modules, lessons, and each lesson’s **`pdfUrl`** (a URL string). Firestore does **not** store the actual PDF bytes.
- **PDF files** are stored in one of two ways:
  - **Local:** Under `public/courses/` (e.g. `public/courses/construction/...`). The seed uses these paths to build lesson entries; `pdfUrl` points at your app’s origin (e.g. `/courses/construction/file.pdf`). Fine for development or when the app serves the files.
  - **Cloud (recommended for production):** Upload PDFs to **Firebase Storage**. The seed can upload each PDF to Storage and save the resulting public URL in Firestore (`pdfUrl`). Learners then open PDFs from Storage. Requires Firebase **Blaze** plan and Storage enabled; see below.

You don’t have to “add courses in Firestore first”: run the seed and it creates courses (and optionally uploads PDFs to Storage). You can also add or edit courses in **Admin → Course content**.

### Upload courses (seed)

1. Set `GOOGLE_APPLICATION_CREDENTIALS` (or `FIREBASE_SERVICE_ACCOUNT`) in `.env`.
2. From project root: `pnpm run seed:courses`
3. Creates courses: construction, industrial-safety, mining, safety-management (with modules/lessons from `public/courses`). New courses are `published: true`. If the seed fails, add courses in **Admin → Course content** and publish.

**Cloud PDFs (Firebase Storage):** To upload PDFs to Firebase Storage and store their URLs in Firestore, enable Storage in the Firebase Console (Blaze plan), set `storageBucket` in your Firebase config (already set in `backend/lib/firestore.ts`), then run:

```bash
UPLOAD_PDFS_TO_STORAGE=true pnpm run seed:courses
```

Ensure Storage rules allow read access for the paths you use (e.g. `courses/*`).

### Where students learn

- **Courses** (`/courses`) – list published courses from Firestore; “View materials” sends users to login, then eligibility is checked on the course/dashboard.
- **Course detail** (`/courses/:courseId`) – description, modules, lessons (PDF, YouTube, text), module quizzes, and course quiz link; uses course-content API, progress, enrollments.
- **Dashboard** (`/dashboard`) – for approved learners; Overview, My courses, Progress, Settings (with logout). Data from `GET /api/course-content/courses` and `GET /api/progress`.

---

## Admin

- **Dashboard** (`/admin`) – analytics, course usage, learner approvals (all from backend APIs).
- **Learners** (`/admin/learners`) – list learners, approve registrations, manage enrollments (users + enrollments APIs).
- **Testimonials** (`/admin/testimonials`) – add testimonials (Firestore).
- **Courses & Quizzes** (`/admin/courses`) – set/edit per-course quiz (quizzes collection).
- **Course content** (`/admin/course-content`) – edit courses, modules, lessons (YouTube, PDF, text), assessments (Firestore course-content APIs); seed/clean PDFs.
- **Settings** (`/admin/settings`) – logout (no API).

Routes: `/admin`, `/admin/courses`, `/admin/course-content`, `/admin/learners`, `/admin/testimonials`, `/admin/settings`. Admin login at `/admin/login` (no link in main nav; use direct URL).

---

## Deployment

### Backend (Render)

1. Web Service, connect repo.
2. **Build:** `pnpm install && pnpm run build:backend`
3. **Start:** `node dist/backend/production.mjs` (or per `render.yaml`)
4. **Environment variables (required):** In Render → your service → **Environment** tab, add these. Your `backend/.env` is not deployed (gitignored), so Render must have them:
   - **`FIREBASE_SERVICE_ACCOUNT`** – Paste the full Firebase service account JSON (single line, no line breaks). Without this, register/login will return **500**. If pasting JSON on Render still causes 500s (quoting/newline issues), use **`FIREBASE_SERVICE_ACCOUNT_BASE64`** instead: run `pnpm run encode:firebase` locally (with `backend/.env` set), copy the printed base64 string, and set that as `FIREBASE_SERVICE_ACCOUNT_BASE64` on Render; remove or leave `FIREBASE_SERVICE_ACCOUNT` empty.
   - **`ADMIN_EMAIL`** – Admin login email.
   - **`ADMIN_PASSWORD`** – Admin login password.
   - **`FRONTEND_URL`** – Your official domain, e.g. `https://www.kigalisafetytraining.com` (for CORS).
   - Optional: `RENDER=true`, `NODE_ENV=production`.

**If register or login returns 500:** Add or fix `FIREBASE_SERVICE_ACCOUNT` (or `FIREBASE_SERVICE_ACCOUNT_BASE64`) in Render → Environment, then redeploy.

**If logs show `16 UNAUTHENTICATED: Request had invalid authentication credentials`:** The backend on Render is not using a valid Firebase service account. Register, login, testimonials, and courses will all return 500 until you set credentials:

1. Locally: ensure `backend/.env` has `FIREBASE_SERVICE_ACCOUNT` (full JSON from Firebase Console → Project settings → Service accounts → Generate new private key).
2. Run: `pnpm run encode:firebase` and copy the **single line** of base64 output (no spaces or line breaks).
3. In Render → your backend service → **Environment**: add **`FIREBASE_SERVICE_ACCOUNT_BASE64`** and paste that value. Remove or leave empty `FIREBASE_SERVICE_ACCOUNT` if you had it (base64 is more reliable on Render).
4. **Save** and **Redeploy**. After deploy, open `https://your-service.onrender.com/health`; you should see `{"ok":true,"firestore":"connected"}`. Then try register/login again.

**Viewing backend logs on Render:** Open your service → **Logs** tab (left sidebar under the service name). Use "Live" or "All" to see stdout/stderr. After deploy, you should see `[START] Backend process starting...` and `[OK] API server running...`. Hit `GET https://your-service.onrender.com/health` to test Firestore; logs will show `[HEALTH] Firestore OK` or `[HEALTH] Firestore FAIL: <message>`.

### Frontend (Netlify)

1. **Build:** `pnpm run build:clients` (or `pnpm install && pnpm run build:clients`)
2. **Publish:** `dist/spa`
3. **Env:** In Netlify → Site settings → Environment variables, add **`VITE_API_URL`** = your backend URL (e.g. `https://ksohtc-platform.onrender.com`, no trailing slash). **Redeploy** after adding or changing it (Vite bakes `VITE_*` in at build time; `clients/.env` is not used on Netlify).

If login/register return 404: the app is calling Netlify’s URL for `/api`. Set `VITE_API_URL` in Netlify and trigger a new deploy.

**Preview/thumbnail:** `index.html` has Open Graph and Twitter meta tags so shared links show a preview (og:image points to logo.webp). For Netlify's dashboard card: Site settings → General → Social preview image.

Backend and frontend are separate: backend on Render, frontend on Netlify; frontend calls backend via `VITE_API_URL`.

---

## Adding features

- **New API route:** Add handler in `backend/routes/`, register in `backend/index.ts` under `/api/...`. Optionally add types in `shared/api.ts`.
- **New page:** Create `clients/pages/MyPage.tsx`, add `<Route path="/my-page" element={<MyPage />} />` in `clients/App.tsx` (above the `*` route).

---

## Security and UX notes

- **Passwords:** User passwords are hashed with **bcrypt** before storage. Existing users with plain-text passwords (if any) still log in via a fallback; new registrations and admin-created users use hashes only.
- **Document titles:** Key pages set `document.title` (e.g. "Contact | KSOHTC") for better tabs and SEO; the default title is restored on navigation.
- **404:** The not-found page uses the same Header and Footer as the rest of the site and a "Return to Home" link.
