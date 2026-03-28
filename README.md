# KSOSHTC Platform

Production-ready full-stack React app with Express backend: React Router 6 SPA, TypeScript, Vite, TailwindCSS, MongoDB. Only add API endpoints when necessary (e.g. private keys, DB operations).

---

## Tech stack

- **PNPM** – package manager
- **Frontend** – React 18, React Router 6, TypeScript, Vite, TailwindCSS 3, Radix UI, Lucide React
- **Backend** – Express, MongoDB (official driver)
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
├── lib/          # MongoDB helpers, etc.
└── routes/

shared/api.ts     # Shared types
```

**Storage:** MongoDB holds all dynamic data (see [Database (MongoDB)](#database-mongodb) below). Set `MONGODB_URI` in `backend/.env` (see `backend/.env.example`).

---

## Pages and backend data

All pages that need dynamic data call the backend API; the backend reads/writes MongoDB.

| Page | Route | Backend API / data |
|------|--------|---------------------|
| **Home** | `/` | `GET /api/testimonials`; contact form `POST /api/contact` (name, email, phone, message) |
| **About** | `/about` | Static content |
| **Programs** | `/programs` | Static content |
| **Industries** | `/industries` | Static content |
| **Contact** | `/contact` | `POST /api/contact` (saves inquiries to MongoDB; name, email, phone, message required) |
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

## Database (MongoDB)

Collections used by the backend (same logical model as before; accessed only from the API):

| Collection | Purpose |
|------------|---------|
| **users** | Registrations, login, approval, sector; name, email, phone (required), organization; passwords stored as bcrypt hashes |
| **testimonials** | Home page “What Our Participants Say”; admin-managed |
| **quizzes** | Per-course final quiz (admin editable) |
| **courses** | Course metadata |
| **modules** | Modules per course |
| **lessons** | Lessons per module (`pdfUrl` points to Cloudinary or other HTTPS URL) |
| **assessments** | Break quizzes in modules |
| **enrollments** | Learner enrollment; status (active/completed) |
| **submissions** | Quiz/assessment submissions |
| **assignment_submissions** | PDF assignment uploads |
| **progress** | Per-user, per-course: completed lessons, passed assessments |
| **inquiries** | Contact form submissions (this is the “contact submissions” collection in Atlas) |
| **password_resets** | Forgot-password tokens |

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
pnpm run init:mongo-collections   # create empty collections + indexes in Atlas (users, inquiries, …)
pnpm run check:mongo-cloudinary   # print document counts for every API collection
```

- **API prefix:** `/api/`
- **Backend:** Run from project root; do not run `pnpm dev` from inside `backend/` (that runs Vite). Backend logs each request (method, path, status, duration).

---

## Environment

- **Root:** `.env` at project root (see `.env.example`).
- **Backend:** Also reads `backend/.env` if present. Use for `MONGODB_URI`, Cloudinary, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_URL` (CORS), etc.

### Admin email notifications (optional)

When someone **registers** or submits the **Contact** form (including from the **Home** page contact section), data is saved to MongoDB. Optionally:

- **Admin** receives an email with registrant/contact details (name, email, phone, etc.). Set SMTP in `backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and optionally `SMTP_FROM`, `SMTP_SECURE`). Example: Gmail with an [App Password](https://support.google.com/accounts/answer/185833). Notifications go to `ADMIN_EMAIL`. If SMTP is not set, no email is sent (MongoDB still saves).
- **Learner** receives an email when their account is **approved** (same SMTP config). Approval happens via Admin → Learners (approve) or when admin sets approved to true on edit.

### Netlify form detection (optional)

The backend can POST a copy of registration and contact submissions to your Netlify site so they appear in **Netlify Forms**. Hidden forms in `index.html` (`name="registration"` and `name="contact"`) with `data-netlify="true"` are required; the backend uses `FRONTEND_URL` (or `NETLIFY_FORM_SUBMIT_URL`) to POST. MongoDB remains the source of truth.

---

## Courses (MongoDB + Cloudinary)

Course list and content (modules, lessons, assessments) live in MongoDB; APIs are under `/api/course-content/*`. Public **Courses** and **Course detail** pages use these APIs.

### Where courses and PDFs live

- **MongoDB** stores course metadata, modules, lessons, and each lesson’s **`pdfUrl`** (HTTPS URL string). It does **not** store PDF bytes.
- **PDF files (production):** Upload via **Admin → Course content** or maintenance scripts; files go to **Cloudinary** (`CLOUDINARY_*` in `backend/.env`). Lesson `pdfUrl` fields point at Cloudinary `secure_url` values.

Add or edit structure in **Admin → Course content**. Use `pnpm run check:mongo-cloudinary` to sanity-check counts and sample URLs locally.

### Where students learn

- **Courses** (`/courses`) – list published courses from the API; “View materials” sends users to login, then eligibility is checked on the course/dashboard.
- **Course detail** (`/courses/:courseId`) – description, modules, lessons (PDF, YouTube, text), module quizzes, and course quiz link; uses course-content API, progress, enrollments.
- **Dashboard** (`/dashboard`) – for approved learners; Overview, My courses, Progress, Settings (with logout). Data from `GET /api/course-content/courses` and `GET /api/progress`.

---

## Admin

- **Dashboard** (`/admin`) – analytics, course usage, learner approvals (all from backend APIs).
- **Learners** (`/admin/learners`) – list learners, approve registrations, manage enrollments (users + enrollments APIs).
- **Testimonials** (`/admin/testimonials`) – add testimonials (MongoDB).
- **Courses & Quizzes** (`/admin/courses`) – set/edit per-course quiz (`quizzes` collection).
- **Course content** (`/admin/course-content`) – edit courses, modules, lessons (YouTube, PDF, text), assessments; PDFs via Cloudinary.
- **Settings** (`/admin/settings`) – logout (no API).

Routes: `/admin`, `/admin/courses`, `/admin/course-content`, `/admin/learners`, `/admin/testimonials`, `/admin/settings`. Admin login at `/admin/login` (no link in main nav; use direct URL).

---

## Deployment

### Backend (Render)

1. Web Service, connect repo.
2. **Build:** `pnpm install && pnpm run build:backend`
3. **Start:** `node dist/backend/production.mjs` (or per `render.yaml`)
4. **Environment variables (required):** In Render → your service → **Environment** tab, add these. Your `backend/.env` is not deployed (gitignored), so Render must have them:
   - **`MONGODB_URI`** – MongoDB Atlas (or other) connection string. Without this, the API returns **500** for most data routes.
   - **`MONGODB_DB`** – Optional if the database name is already in the URI path (e.g. `.../ksoshtc?...`).
   - **`CLOUDINARY_CLOUD_NAME`**, **`CLOUDINARY_API_KEY`**, **`CLOUDINARY_API_SECRET`** – Required for admin PDF/cover uploads.
   - **`ADMIN_EMAIL`** – Admin login email.
   - **`ADMIN_PASSWORD`** – Admin login password.
   - **`FRONTEND_URL`** – Your official domain, e.g. `https://www.kigalisafetytraining.com` (for CORS).
   - Optional: `RENDER=true`, `NODE_ENV=production`.

**If register or login returns 500:** Check `MONGODB_URI` and redeploy. Open `GET https://your-service.onrender.com/health`; you should see `{"ok":true,"mongodb":"connected"}`.

**Viewing backend logs on Render:** Open your service → **Logs** tab. After deploy you should see `[START] Backend process starting...` and `[MONGODB] OK` (or a clear connection error).

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
- **Document titles:** Key pages set `document.title` (e.g. "Contact | KSOSHTC") for better tabs and SEO; the default title is restored on navigation.
- **404:** The not-found page uses the same Header and Footer as the rest of the site and a "Return to Home" link.
