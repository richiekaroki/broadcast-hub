<div align="center">

# BroadcastHub

**Media & Broadcast Content Management Platform**

Fullstack monorepo — NestJS v11 + React 18 + Vite

[![CI](https://github.com/richiekaroki/broadcast-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/richiekaroki/broadcast-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Live

| Service | URL |
|---------|-----|
| **Frontend** | [broadcast-hub-web.vercel.app](https://broadcast-hub-web.vercel.app) |
| **API** | [wam-broadcast-hub.onrender.com](https://wam-broadcast-hub.onrender.com) |
| **Swagger** | [wam-broadcast-hub.onrender.com/api/docs](https://wam-broadcast-hub.onrender.com/api/docs) |

---

## What it does

A content management platform for broadcast media — radio stations, TV networks, digital publishers. Handles the full editorial lifecycle from draft to publication, with role-based access control and real-time analytics.

**Key features:**

- Passwordless auth (magic link email + Google OAuth)
- 5-role RBAC — Super Admin, Editor, Presenter, Advertiser, Viewer
- Editorial workflow — draft → review → publish/reject
- Broadcast schedule management
- Analytics dashboard (views, clicks)
- In-memory caching for hot paths
- Full Swagger/OpenAPI documentation

---

## Architecture

```
broadcast-hub/
├── apps/
│   ├── api/                  NestJS v11 backend
│   │   ├── src/
│   │   │   ├── auth/         Magic link + OAuth + JWT
│   │   │   ├── content/      CRUD + editorial workflow
│   │   │   ├── programs/     Broadcast schedule
│   │   │   ├── analytics/    View/click tracking
│   │   │   ├── dashboard/    Aggregated stats
│   │   │   ├── email/        Brevo SMTP integration
│   │   │   └── health/       Health checks
│   │   └── ...
│   └── web/                  React 18 + Vite frontend
│       └── src/
│           ├── features/     Page components
│           ├── components/   Shared UI
│           ├── api/          API client
│           └── store/        Redux state
├── render.yaml               Render deployment config
├── docker-compose.yml        Local dev stack
└── .env.example
```

**Infra:** PostgreSQL (Neon) · Brevo SMTP · Vercel (frontend) · Render (API)

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or [Neon](https://neon.tech) free tier)

### 1. Clone & install

```bash
git clone https://github.com/richiekaroki/broadcast-hub.git
cd broadcast-hub
cp .env.example .env
```

Edit `.env` — add your Neon `DATABASE_URL` and Brevo SMTP credentials.

### 2. Start database (local)

```bash
docker compose up -d postgres
```

Or use Neon — just update `DATABASE_URL` in `.env`.

### 3. Seed demo data

```bash
cd apps/api
npm install
npm run seed
```

### 4. Start backend

```bash
npm run start:dev     # → http://localhost:4000
```

### 5. Start frontend

```bash
cd ../web
npm install
npm run dev           # → http://localhost:3000
```

### 6. Swagger docs

```
http://localhost:4000/api/docs
```

---

## Auth flow

**Passwordless magic link:**

1. Enter email at login
2. Receive a magic link via email (Brevo SMTP)
3. Click link → verified → JWT pair issued
4. Refresh token rotates on every use

**Demo accounts** — enter these emails at login:

| Role | Email |
|------|-------|
| Super Admin | `admin@demo.com` |
| Editor | `editor@demo.com` |
| Presenter | `presenter@demo.com` |
| Advertiser | `advertiser@demo.com` |
| Viewer | `viewer@demo.com` |

---

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | Public | Health check |
| `POST` | `/api/v1/auth/magic-link` | Public | Request magic link |
| `GET` | `/api/v1/auth/magic-link/verify` | Public | Verify magic link |
| `GET` | `/api/v1/auth/oauth/google` | Public | Google OAuth |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh token |
| `POST` | `/api/v1/auth/logout` | JWT | Revoke token |
| `GET` | `/api/v1/content` | JWT | List content |
| `POST` | `/api/v1/content` | Editor+ | Create draft |
| `PATCH` | `/api/v1/content/:id` | Editor+ | Update draft |
| `POST` | `/api/v1/content/:id/submit` | Editor | Submit for review |
| `PATCH` | `/api/v1/content/:id/publish` | Admin | Publish |
| `PATCH` | `/api/v1/content/:id/reject` | Admin | Reject |
| `DELETE` | `/api/v1/content/:id` | Admin | Delete |
| `GET` | `/api/v1/programs` | JWT | Broadcast schedule |
| `POST` | `/api/v1/programs` | Presenter+ | Create program |
| `PATCH` | `/api/v1/programs/:id` | Presenter+ | Update program |
| `PATCH` | `/api/v1/programs/:id/cancel` | Admin | Cancel program |
| `GET` | `/api/v1/dashboard` | JWT | Dashboard stats |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS v11, TypeORM, Passport, Swagger/OpenAPI |
| **Frontend** | React 18, Vite, Tailwind CSS v4, Redux Toolkit, TanStack Query |
| **Database** | PostgreSQL (Neon) |
| **Email** | Brevo SMTP (nodemailer) |
| **Auth** | JWT (dual-secret), magic link, Google OAuth2 |
| **Deploy** | Render (API), Vercel (frontend), GitHub Actions CI |
| **Testing** | Jest, SuperTest, 80%+ coverage threshold |

---

## Testing

```bash
cd apps/api
npm test              # unit tests
npm run test:cov      # coverage report
```

---

## Deployment

### Frontend (Vercel)

Connected to GitHub — auto-deploys on push to `main`.

Set `VITE_API_URL` in Vercel dashboard to your Render API URL.

### Backend (Render)

1. Connect GitHub repo at [render.com](https://render.com)
2. Create Web Service → Root: `apps/api`
3. Build: `npm install && npm run build`
4. Start: `node dist/main`
5. Add env vars (see `.env.example`)

### Database (Neon)

1. Create free account at [neon.tech](https://neon.tech)
2. Create project → copy connection string
3. Set as `DATABASE_URL` in Render env vars
4. Run `npm run seed` locally to populate demo data

---

## Author

**Richard Karoki** — Full Stack Developer, Nairobi, Kenya

[![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:karokirichard522@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/richard-karoki007)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/richiekaroki)

---

<div align="center">

Built with care in Nairobi, Kenya 🇰🇪

</div>
