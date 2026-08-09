# BroadcastHub — Media & Broadcast Content Management Platform

A production-grade fullstack monorepo — **NestJS v11** backend + **React 18 + Vite** frontend.
Built as a portfolio project demonstrating real-world architecture for high-velocity media infrastructure.

## 🔗 Live Links

| | URL |
| --- | --- |
| **Frontend** | <https://broadcast-hub-web.vercel.app> |
| **Backend API** | <https://broadcast-hub-api.onrender.com> |
| **Swagger Docs** | <https://broadcast-hub-api.onrender.com/api/docs> |
| **GitHub** | <https://github.com/richiekaroki/broadcast-hub> |

> **Note:** Replace these URLs with your actual deployment URLs after deploying to Vercel + Render.

---

## Architecture

```
broadcast-hub/
├── apps/
│   ├── api/          ← NestJS v11 backend  (port 4000)
│   └── web/          ← React 18 + Vite frontend (port 3000)
├── .github/workflows/ci.yml
├── docker-compose.yml
└── .env.example
```

**Databases:** PostgreSQL (TypeORM) · MongoDB (Mongoose) · Redis (ioredis)
**Auth:** JWT dual-secret · Google OAuth2 · Refresh token rotation · Logout revocation
**RBAC:** 5 roles — SUPER_ADMIN, EDITOR, PRESENTER, ADVERTISER, VIEWER

---

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- Docker Desktop (for Redis)
- PostgreSQL 17 native
- MongoDB 8 native

### 1. Clone & configure

```bash
git clone https://github.com/richiekaroki/broadcast-hub.git
cd broadcast-hub
cp .env.example .env
# Edit .env — add your JWT secrets and Google OAuth credentials
```

### 2. Create PostgreSQL user + database

```bash
psql -U postgres -c "CREATE USER bh_user WITH PASSWORD 'bh_pass';"
psql -U postgres -c "CREATE DATABASE broadcasthub OWNER bh_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE broadcasthub TO bh_user;"
```

### 3. Start Redis (Docker)

```bash
docker compose up -d redis
```

### 4. Backend

```bash
cd apps/api
npm install
npm run start:dev     # → http://localhost:4000
```

### 5. Seed demo data

```bash
# (from apps/api, after start:dev is running)
npm run seed
```

### 6. Frontend

```bash
cd apps/web
npm install
npm run dev           # → http://localhost:3000
```

### 7. Swagger API docs

```
http://localhost:4000/api/docs
```

---

## Root Convenience Scripts

From the project root after running `npm install` in both apps:

```bash
npm run api           # start NestJS backend
npm run web           # start React frontend
npm run seed          # populate demo data
npm run test          # run unit tests
npm run test:cov      # run tests with coverage report
npm run test:e2e      # run E2E tests (needs all 3 DBs running)
npm run docker:dev    # start Redis only via Docker
npm run docker:all    # start all 5 services via Docker
```

---

## Demo Credentials

All accounts use password: **Demo1234!**

| Role | Email | Access |
| --- | --- | --- |
| super_admin | <admin@demo.com> | Full access — publish, reject, manage |
| editor | <editor@demo.com> | Create drafts, submit for review |
| presenter | <presenter@demo.com> | Create & manage programs |
| advertiser | <advertiser@demo.com> | Read-only |
| viewer | <viewer@demo.com> | Published content only |

---

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | Public | Health check (DBs + memory) |
| POST | /api/v1/auth/register | Public | Register new user |
| POST | /api/v1/auth/login | Public | Login, receive token pair |
| GET | /api/v1/auth/oauth/google | Public | Google OAuth redirect |
| POST | /api/v1/auth/refresh | Public | Rotate refresh token |
| POST | /api/v1/auth/logout | JWT | Revoke refresh token |
| GET | /api/v1/content | JWT | List published content (Redis cached) |
| POST | /api/v1/content | EDITOR+ | Create draft |
| PATCH | /api/v1/content/:id | EDITOR+ | Update draft |
| POST | /api/v1/content/:id/submit | EDITOR | Submit for review |
| PATCH | /api/v1/content/:id/publish | SUPER_ADMIN | Publish |
| PATCH | /api/v1/content/:id/reject | SUPER_ADMIN | Reject with reason |
| DELETE | /api/v1/content/:id | SUPER_ADMIN | Delete |
| GET | /api/v1/programs | JWT | Broadcast schedule (Redis cached, paginated) |
| POST | /api/v1/programs | PRESENTER+ | Create schedule slot |
| PATCH | /api/v1/programs/:id | PRESENTER+ | Update program |
| PATCH | /api/v1/programs/:id/cancel | SUPER_ADMIN | Cancel program |
| GET | /api/v1/dashboard | JWT | Aggregated stats (Redis cached) |

---

## Deployment

### Frontend → Vercel

```bash
cd apps/web
npm install -g vercel
vercel
# Set VITE_API_URL=https://your-backend.onrender.com in Vercel dashboard
```

### Backend → Render

```bash
# Connect your GitHub repo at render.com
# Render will auto-detect render.yaml and provision:
#   - Web service (NestJS API)
#   - PostgreSQL database (free tier)
#   - MongoDB database (free tier)
#   - Redis database (free tier)
# Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL in Render dashboard
```

---

## Testing

```bash
cd apps/api
npm test              # unit tests — no DB needed, runs in seconds
npm run test:cov      # coverage report → open coverage/lcov-report/index.html
npm run test:e2e      # full E2E — requires docker compose up -d postgres mongo redis
```

---

## Tech Stack

**Backend:** NestJS v11 · TypeORM · Mongoose · ioredis · Passport · bcrypt · Swagger/OpenAPI
**Frontend:** React 18 · Vite · Tailwind CSS v4 · Redux Toolkit · TanStack Query · React Router v6
**Databases:** PostgreSQL 17 · MongoDB 8 · Redis 7
**DevOps:** Docker · Docker Compose · GitHub Actions CI/CD
**Testing:** Jest · SuperTest · 80%+ coverage threshold

---

## Author

**Richard Karoki** — Full Stack Developer, Nairobi Kenya
📧 <karokirichard522@gmail.com>
🔗 linkedin.com/in/richard-karoki007
🐙 github.com/richiekaroki
