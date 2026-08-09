<div align="center">

# Wam Broadcast Hub

**Content management platform for radio, TV, and digital publishers.**

[![CI](https://github.com/richiekaroki/broadcast-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/richiekaroki/broadcast-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## What it does

Manage articles, broadcast schedules, and editorial workflows from one dashboard. Built for media teams that need role-based access, content pipelines, and real-time analytics.

**Core features:**

- Passwordless auth (magic link + Google OAuth)
- 5-role access control, Super Admin, Editor, Presenter, Advertiser, Viewer
- Editorial workflow, draft to review to publish/reject
- Broadcast schedule management
- Analytics dashboard
- Responsive design (mobile + desktop)

---

## Live

| Service | URL |
|---------|-----|
| Frontend | [broadcast-hub-web.vercel.app](https://broadcast-hub-web.vercel.app) |
| API | [wam-broadcast-hub.onrender.com](https://wam-broadcast-hub.onrender.com) |
| Swagger | [wam-broadcast-hub.onrender.com/api/docs](https://wam-broadcast-hub.onrender.com/api/docs) |

---

## Quick start

```bash
git clone https://github.com/richiekaroki/broadcast-hub.git
cd broadcast-hub
cp .env.example .env
```

Edit `.env` with your database and SMTP credentials.

```bash
docker compose up -d postgres    # start database
cd apps/api && npm run seed      # populate demo data
npm run start:dev                # → http://localhost:4000

cd ../web && npm run dev         # → http://localhost:3000
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS v11, TypeORM, Passport, Swagger |
| Frontend | React 19, Vite, Redux Toolkit, TanStack Query |
| Database | PostgreSQL (Neon) |
| Auth | JWT (dual-secret), magic link, Google OAuth2 |
| Deploy | Render (API), Vercel (frontend) |

---

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/magic-link` | Public | Request magic link |
| `GET` | `/api/v1/auth/magic-link/verify` | Public | Verify magic link |
| `GET` | `/api/v1/auth/oauth/google` | Public | Google OAuth |
| `GET` | `/api/v1/content` | JWT | List content |
| `POST` | `/api/v1/content` | Editor+ | Create draft |
| `PATCH` | `/api/v1/content/:id/publish` | Admin | Publish |
| `GET` | `/api/v1/programs` | JWT | Broadcast schedule |
| `GET` | `/api/v1/dashboard` | JWT | Dashboard stats |

Full docs at `/api/docs`.

---

## Author

**Richard Karoki**, Full Stack Developer, Nairobi, Kenya

[![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:karokirichard522@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/richard-karoki007)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/richiekaroki)

---

<div align="center">

Built with care in Nairobi, Kenya 🇰🇪

</div>
