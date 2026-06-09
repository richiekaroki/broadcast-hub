# BroadcastHub Media‑Broadcast Management API – Implementation Plan (v2)

> **Revision notes (June 2026):** Updated after full code review of all backend modules. All open questions from v1 have been answered. Bug fixes, missing features, and testing strategy are now concrete and actionable.

---

## 1. Architecture Overview

| Layer | Technology | Responsibility |
|---|---|---|
| **API** | NestJS (v11) | Modular services, controllers, guards |
| **Relational store** | PostgreSQL (TypeORM) | Users, Content, Programs, RefreshToken |
| **Event store** | MongoDB (Mongoose) | Analytics events (view, click, share) |
| **Cache** | Redis (`@nestjs-modules/ioredis`) | Content list, program schedule, dashboard stats |
| **Auth** | JWT (access 15 min / refresh 7 d), Google OAuth2 (`passport-google-oauth20`) | — |
| **Deployment** | Docker multi-stage, Docker Compose, GitHub Actions CI/CD | — |
| **Testing** | Jest unit, SuperTest e2e (real containers) | — |

---

## 2. Data Model

### 2.1 Enums

```ts
// user-role.enum.ts — already correct
export enum UserRole { SUPER_ADMIN, PRESENTER, EDITOR, ADVERTISER, VIEWER }

// content.entity.ts — already correct
export enum ContentStatus { DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED }

// program.entity.ts — CHANGE: promote type alias to a real enum
export enum ProgramStatus { SCHEDULED = 'scheduled', LIVE = 'live', COMPLETED = 'completed', CANCELLED = 'cancelled' }
```

### 2.2 PostgreSQL Entities

#### User *(fixes required)*
```
id            uuid PK
email         varchar UNIQUE NOT NULL
name          varchar NOT NULL        ← ADD (missing from current entity)
passwordHash  varchar NULLABLE        (OAuth users have no password)
googleId      varchar NULLABLE        ← ADD (for OAuth re-login)
role          enum(UserRole) DEFAULT VIEWER
createdAt     timestamp
updatedAt     timestamp
```

#### Content *(fixes required)*
```
id              uuid PK
title           varchar NOT NULL
body            text NOT NULL
status          enum(ContentStatus) DEFAULT DRAFT
authorId        uuid FK → users.id    ← ADD (missing from current entity)
rejectionReason varchar NULLABLE
createdAt       timestamp
updatedAt       timestamp
```

#### Program *(minor fix)*
```
id           uuid PK
title        varchar NOT NULL
startTime    timestamp NOT NULL
endTime      timestamp NOT NULL
status       enum(ProgramStatus) DEFAULT SCHEDULED   ← change from varchar to enum
presenterId  uuid FK → users.id NULLABLE
createdAt    timestamp
updatedAt    timestamp
```

#### RefreshToken *(new — required for logout/revocation)*
```
id         uuid PK
tokenHash  varchar NOT NULL    (bcrypt hash of the raw token)
userId     uuid FK → users.id
expiresAt  timestamp NOT NULL
createdAt  timestamp
```

### 2.3 MongoDB Schema (AnalyticsEvent) — no changes needed

```ts
@Schema({ timestamps: true, collection: 'analytics_events' })
export class AnalyticsEvent {
  @Prop({ required: true, index: true }) entityType: 'content' | 'program' | 'advertisement';
  @Prop({ required: true, index: true }) entityId: string;
  @Prop({ index: true }) userId?: string;
  @Prop({ required: true }) action: 'view' | 'click' | 'share';
  @Prop({ type: Object, default: {} }) meta: Record<string, unknown>;
}
// Compound index: { entityId: 1, action: 1, createdAt: -1 }
```

---

## 3. Bug Fixes — Must Complete Before Demo

These are confirmed bugs from the code review; fix them before any testing or Loom recording.

### Fix 1 — Add `name` column to `User` entity
```ts
// user.entity.ts
@Column()
name: string;
```
Also update `UsersService.create()` to accept and persist `name`, and update `RegisterDto` (already has `@IsString() name` — just needs the entity to match).

### Fix 2 — Add `authorId` column to `Content` entity
```ts
// content.entity.ts
@Column({ name: 'author_id', nullable: true })
authorId: string;
```
Update `CreateContentDto` or set `authorId` from `@CurrentUser()` in the controller.

### Fix 3 — Fix `content.service.ts` — remove the `as any` cast in `reject()`
```ts
// BEFORE (wrong)
(content as any).rejectionReason = reason;

// AFTER (correct — rejectionReason is already on the entity)
content.rejectionReason = reason;
```

### Fix 4 — Fix seed.ts SQL to match actual entity columns
The seed inserts `name`, `is_active`, `author_id` columns that don't currently exist.
After applying Fixes 1 and 2, update the TRUNCATE to use the correct table name (`content` not `contents`) and remove `is_active` from the INSERT if you don't add that column.

### Fix 5 — Fix the duplicate branch in seed.ts
```ts
// BEFORE — both branches identical
const authorId = c.status === 'draft' ? editorUser.id : editorUser.id;

// AFTER — admin publishes, editor drafts
const authorId = c.status === 'draft' ? editorUser.id : adminUser.id;
```

### Fix 6 — Wire `ThrottlerGuard` as a global guard
```ts
// app.module.ts — add to providers array
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
```
Without this the rate limiter is configured but never enforced.

---

## 4. Modules & Core Logic

### 4.1 Auth Module

**Service (`AuthService`) — changes required:**

- `generateTokens(user)`: use **two separate secrets** — `JWT_SECRET` for access, `JWT_REFRESH_SECRET` for refresh. Add `audience` claim to distinguish them.
  ```ts
  const accessToken  = await this.jwtService.signAsync(payload, { secret: cfg.JWT_SECRET,         expiresIn: '15m' });
  const refreshToken = await this.jwtService.signAsync(payload, { secret: cfg.JWT_REFRESH_SECRET, expiresIn: '7d', audience: 'refresh' });
  ```
- `refreshTokens(token)`: verify against `JWT_REFRESH_SECRET`; look up `RefreshToken` row by hash; delete the old row (rotation); insert a new row; issue new pair.
- Add `logout(refreshToken)`: hash the token, find and delete the `RefreshToken` row → immediate revocation.

**Controller — add:**
- `POST /api/v1/auth/logout` (requires `JwtAuthGuard`, deletes refresh token row)

**Google Strategy:**
- Remove `passReqToCallback: true` unless you are actively using `req` for CSRF state.
- The callback endpoint should **redirect** to the frontend with tokens as a query param or short-lived code, not return JSON — browsers cannot read JSON from OAuth redirects.
- Add `googleId` to the `findOrCreateOAuthUser` lookup to avoid email-collision issues.

**Guards & Decorators — no changes needed.**

### 4.2 Users Module

**Entity** — add `name` and `googleId` columns (see Fix 1).

**Service** — add `findById(id)` method so `AuthModule` can remove its duplicate repository:
```ts
async findById(id: string): Promise<User | null> {
  return this.userRepo.findOne({ where: { id } });
}
```
Export this from `UsersModule`; remove `TypeOrmModule.forFeature([User])` from `AuthModule`.

### 4.3 Content Module

**Entity** — add `authorId` column (see Fix 2).

**DTOs:**
- Remove `status` from `CreateContentDto` — clients must not set status directly. Status transitions happen via dedicated endpoints only.
- Add `@ApiProperty()` to all DTO fields for Swagger schema generation.
- Create `UpdateContentDto` using `PartialType(CreateContentDto)` (from `@nestjs/swagger`) instead of `Partial<CreateContentDto>` in the controller.

**Service:**
- `reject()` — remove `as any` cast (Fix 3).
- `recordView` call in controller — add `.catch(err => Logger.error(err))` to prevent silent failures swallowing analytics errors.
- `GET /content/:id` — currently returns any content regardless of status. Add a check: if status is not `PUBLISHED`, only `SUPER_ADMIN` or `EDITOR` should see it; return 404 for `VIEWER`/`PRESENTER`.

### 4.4 Programs Module

**Entity** — promote `ProgramStatus` from a type alias to an enum; update column decorator accordingly.

**Service:**
- Replace raw string literals with enum values:
  ```ts
  where: [{ status: ProgramStatus.SCHEDULED }, { status: ProgramStatus.LIVE }]
  ```
- Add `endTime > startTime` validation (either in DTO with a custom validator, or a guard in `create()`):
  ```ts
  if (new Date(dto.endTime) <= new Date(dto.startTime))
    throw new BadRequestException('endTime must be after startTime');
  ```

**Controller:**
- Replace `data as any` cast with a proper `UpdateProgramDto` (`PartialType(CreateProgramDto)`).

### 4.5 Analytics Module — no structural changes

Add error logging inside `recordView`:
```ts
async recordView(contentId: string, userId?: string): Promise<void> {
  this.model.create({ ... }).catch(err => this.logger.error('Analytics write failed', err));
}
```

### 4.6 Dashboard Module

Replace direct repository injection with service injection to avoid cross-module entity ownership:
```ts
// Instead of @InjectRepository(User) and @InjectRepository(Content):
constructor(
  private usersService: UsersService,       // from UsersModule
  private contentService: ContentService,   // from ContentModule
  private analyticsService: AnalyticsService,
  @InjectRedis() private redis: Redis,
) {}
```
Import `UsersModule` and `ContentModule` in `DashboardModule` instead of `TypeOrmModule.forFeature([User, Content])`.

---

## 5. Caching (Redis)

| Key | Value | TTL | Invalidated by |
|---|---|---|---|
| `content:list` | JSON array of published content | 5 min | publish, reject, delete |
| `programs:schedule` | JSON array of scheduled + live programs | 2 min | create, update, cancel |
| `dashboard:stats` | `{ totalUsers, totalContent, publishedContent, todayViews }` | 5 min | new user, publish/delete content |

---

## 6. Security & Validation

- Passwords hashed with bcrypt, 12 salt rounds ✅
- Two JWT secrets: `JWT_SECRET` (access) and `JWT_REFRESH_SECRET` (refresh)
- Refresh tokens stored hashed in `RefreshToken` table; rotated on each use
- `POST /auth/logout` revokes refresh token immediately
- DTO validation via `class-validator` ✅
- Custom validator: `endTime > startTime` on `CreateProgramDto`
- Global rate limiting: 100 req/min per IP via `ThrottlerGuard` (wire up APP_GUARD — see Fix 6)
- `helmet()` for security headers ✅
- CORS whitelist via `FRONTEND_URL` env var ✅
- `ValidationPipe({ whitelist: true, transform: true })` ✅

---

## 7. Testing Strategy

### 7.1 How to Run Tests

```bash
# Prerequisites — start all three DB services:
docker compose up -d postgres mongo redis

# Unit tests (no DB needed)
npm test

# Unit tests in watch mode during development
npm run test:watch

# Coverage report (target ≥ 80%)
npm run test:cov

# E2E tests (requires running DB services)
npm run test:e2e
```

### 7.2 Unit Tests — write these first

Location: alongside each service as `*.spec.ts`.

**`auth.service.spec.ts`**
```ts
describe('AuthService', () => {
  it('register() throws ConflictException if email exists')
  it('register() hashes password and returns tokens')
  it('login() throws UnauthorizedException for wrong password')
  it('login() returns accessToken and refreshToken on success')
  it('generateTokens() signs access with JWT_SECRET and refresh with JWT_REFRESH_SECRET')
  it('refreshTokens() throws UnauthorizedException for expired token')
  it('refreshTokens() rotates token — old row deleted, new row inserted')
  it('logout() deletes refresh token row')
})
```

**`content.service.spec.ts`**
```ts
describe('ContentService', () => {
  it('create() sets status to DRAFT regardless of DTO input')
  it('findPublished() returns cached result on second call')
  it('findPublished() queries DB on cache miss and stores result')
  it('publish() changes status to PUBLISHED and invalidates cache')
  it('reject() changes status to REJECTED and stores rejectionReason')
  it('submitForReview() transitions DRAFT → PENDING_REVIEW')
  it('findOne() throws NotFoundException for unknown id')
  it('remove() throws NotFoundException if nothing deleted')
})
```

**`programs.service.spec.ts`**
```ts
describe('ProgramsService', () => {
  it('create() throws BadRequestException when endTime <= startTime')
  it('findSchedule() returns cached schedule on warm cache')
  it('findSchedule() queries DB and caches on miss')
  it('cancel() sets status to CANCELLED')
  it('update() throws NotFoundException for unknown id')
})
```

**`dashboard.service.spec.ts`**
```ts
describe('DashboardService', () => {
  it('getStats() returns cached: true on cache hit')
  it('getStats() runs parallel DB queries and caches result on miss')
})
```

**`analytics.service.spec.ts`**
```ts
describe('AnalyticsService', () => {
  it('getTodayViews() counts only today UTC views')
  it('recordView() inserts a document without throwing')
})
```

### 7.3 Setting Up Unit Tests with Mocks

```ts
// Example: content.service.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getRedisToken } from '@nestjs-modules/ioredis';
import { ContentService } from './content.service';
import { Content } from './entities/content.entity';

describe('ContentService', () => {
  let service: ContentService;
  const mockRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(),
                     findOne: jest.fn(), delete: jest.fn() };
  const mockRedis = { get: jest.fn(), setex: jest.fn(), del: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: getRepositoryToken(Content), useValue: mockRepo },
        { provide: getRedisToken(),             useValue: mockRedis },
      ],
    }).compile();
    service = module.get(ContentService);
  });

  it('create() forces DRAFT status', async () => {
    mockRepo.create.mockReturnValue({ status: 'draft' });
    mockRepo.save.mockResolvedValue({ id: '1', status: 'draft' });
    mockRedis.del.mockResolvedValue(1);
    const result = await service.create({ title: 'T', body: 'B' });
    expect(result.status).toBe('draft');
  });
});
```

### 7.4 E2E Tests

Location: `test/app.e2e-spec.ts`. Use SuperTest with a real NestJS app and real DB services (started via Docker Compose in CI).

**Full happy-path flow:**
```ts
describe('Editorial workflow (e2e)', () => {
  let editorToken: string;
  let adminToken: string;
  let contentId: string;

  it('POST /auth/login → editor gets token')
  it('POST /content → editor creates draft (201)')
  it('GET /content → draft not visible in published list')
  it('POST /content/:id/submit → EDITOR submits for review (200)')
  it('PATCH /content/:id/publish → SUPER_ADMIN publishes (200)')
  it('GET /content → published item now appears in list (200)')
  it('GET /content/:id → view recorded in analytics (200)')
  it('GET /dashboard → todayViews > 0, cached: false (200)')
  it('GET /dashboard → cached: true on second call (200)')
})

describe('Auth flow (e2e)', () => {
  it('POST /auth/register → 201 with tokens')
  it('POST /auth/login → 200 with tokens')
  it('POST /auth/refresh → 200 with new token pair')
  it('POST /auth/logout → 200, subsequent refresh with old token → 401')
  it('GET /content with no token → 401')
})

describe('Role enforcement (e2e)', () => {
  it('VIEWER cannot POST /content → 403')
  it('EDITOR cannot PATCH /content/:id/publish → 403')
  it('PRESENTER cannot DELETE /content/:id → 403')
})

describe('Program schedule (e2e)', () => {
  it('POST /programs → PRESENTER creates slot (201)')
  it('GET /programs → returns cached schedule (200)')
  it('PATCH /programs/:id/cancel → SUPER_ADMIN cancels (200)')
  it('GET /programs after cancel → cancelled slot not in results (200)')
})
```

### 7.5 Coverage Target

```json
// jest config in package.json
"coverageThreshold": {
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```

Run `npm run test:cov` and open `coverage/lcov-report/index.html` to see which branches are uncovered.

---

## 8. Docker & Local Development

### Dockerfile (multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main"]
```

### docker-compose.yml
```yaml
version: '3.9'
services:
  api:
    build: .
    ports: ['4000:4000']
    env_file: .env
    depends_on: [postgres, mongo, redis]
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bh_user
      POSTGRES_PASSWORD: bh_pass
      POSTGRES_DB: broadcasthub
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']
  mongo:
    image: mongo:7.0
    ports: ['27017:27017']
    volumes: ['mongodata:/data/db']
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

volumes:
  pgdata:
  mongodata:
```

### .env.example
```
DATABASE_URL=postgres://bh_user:bh_pass@localhost:5432/broadcasthub
MONGODB_URL=mongodb://localhost:27017/broadcasthub
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

---

## 9. CI/CD (GitHub Actions)

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_USER: bh_user, POSTGRES_PASSWORD: bh_pass, POSTGRES_DB: broadcasthub }
        ports: ['5432:5432']
        options: --health-cmd "pg_isready -U bh_user" --health-interval 10s --health-retries 5
      mongo:
        image: mongo:7.0
        ports: ['27017:27017']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    env:
      DATABASE_URL: postgres://bh_user:bh_pass@localhost:5432/broadcasthub
      MONGODB_URL: mongodb://localhost:27017/broadcasthub
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
      JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
      GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
      GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
      GOOGLE_CALLBACK_URL: ${{ secrets.GOOGLE_CALLBACK_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - run: npm test -- --coverage
      - run: npm run test:e2e
      - name: Build Docker image
        run: docker build -t broadcast-hub-api .
```

---

## 10. Swagger / API Documentation

Every controller endpoint must have:
- `@ApiOperation({ summary: '...' })` ✅ (already done)
- `@ApiResponse({ status: 200, description: '...' })` and `@ApiResponse({ status: 401, ... })` etc. ← add these
- `@ApiProperty()` on every DTO field ← partially done (`create-program.dto.ts` has them; others need them)

Add an npm script to export the OpenAPI spec:
```json
"swagger:export": "ts-node -e \"require('./src/swagger-export')\"" 
```

---

## 11. Seed Data

After applying entity fixes (name, authorId columns, correct table name), the seed will work correctly. Summary of seed changes needed:

- Change `TRUNCATE TABLE contents` → `TRUNCATE TABLE content` (matches `@Entity('content')`)
- Remove `is_active` column from user INSERT (not on entity)
- Fix the `authorId` branch logic (Fix 5 above)
- Optionally add program seed slots for a fuller demo

Run the seed:
```bash
# With Docker Compose running:
npm run seed
```

---

## 12. Roll-out Order (Updated MVP)

1. **Entity fixes** — add `name`, `authorId`, `googleId` to entities; promote `ProgramStatus` to enum ← **do first, everything else depends on this**
2. **Auth hardening** — two JWT secrets, `RefreshToken` table, `logout` endpoint
3. **Bug fixes** — `as any` cast, `ThrottlerGuard` wiring, seed SQL
4. **DTO cleanup** — remove `status` from `CreateContentDto`; add `@ApiProperty()`; create `UpdateProgramDto`
5. **Dashboard refactor** — inject services instead of repositories
6. **Unit tests** — one spec file per service, mocked dependencies
7. **E2E tests** — full workflow against Docker Compose services
8. **CI pipeline** — GitHub Actions with coverage enforcement
9. **Seed fix + demo** — fix SQL, run seed, record Loom

---

## 13. Open Questions — Resolved

| Question | Decision |
|---|---|
| Refresh token store | **Persisted `RefreshToken` table** — required for logout/revocation |
| Email verification | **Not for MVP** — can add post-hire; document as known gap |
| Advertiser endpoints | **Seeded role only** for now — stub `GET /advertisers` in Phase 2 |
| Rate-limit per role | **Global 100 req/min** for MVP; extend with dynamic throttler post-MVP |
| Logging/monitoring | **NestJS built-in `Logger`** for MVP; plan `pino`/`winston` in Phase 2 |

---

## 14. Phase 2 Backlog (Post-MVP)

- Persisted advertiser campaign endpoints (`GET/POST /api/v1/advertisers/:id/campaigns`)
- Per-role rate-limit customization via dynamic `ThrottlerGuard` provider
- Structured logging with `@nestjs/pino` (JSON output, log levels via env)
- Content pagination — `skip`/`take` query params on `GET /content` and `GET /programs`
- Program time-conflict detection — reject overlapping slots on create/update
- Cache-aware dashboard — invalidate `dashboard:stats` on every `recordView` call
- OpenAPI JSON export script (`npm run swagger:export`)
- Email verification workflow on registration
- Prometheus metrics endpoint (`/metrics`) via `@willsoto/nestjs-prometheus`
