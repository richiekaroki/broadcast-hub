import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests — require Docker Compose services running:
 *   docker compose up -d postgres mongo redis
 *   npm run test:e2e
 */
describe('Wam Broadcast Hub E2E', () => {
  let app: INestApplication;

  // Tokens per role
  let adminToken:     string;
  let editorToken:    string;
  let viewerToken:    string;
  let adminRefresh:   string;
  let contentId:      string;
  let programId:      string;

  // ── App bootstrap ─────────────────────────────────────────────────────────────
  beforeAll(async () => {
    jest.setTimeout(30000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ── Auth flow ─────────────────────────────────────────────────────────────────
  describe('Auth', () => {
    it('POST /auth/login — admin gets tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@demo.com', password: 'Demo1234!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      adminToken   = res.body.accessToken;
      adminRefresh = res.body.refreshToken;
    });

    it('POST /auth/login — editor gets tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'editor@demo.com', password: 'Demo1234!' })
        .expect(200);

      editorToken = res.body.accessToken;
    });

    it('POST /auth/login — viewer gets tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'viewer@demo.com', password: 'Demo1234!' })
        .expect(200);

      viewerToken = res.body.accessToken;
    });

    it('POST /auth/login — returns 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@demo.com', password: 'WrongPassword' })
        .expect(401);
    });

    it('POST /auth/refresh — returns new token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: adminRefresh })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.accessToken).not.toBe(adminToken); // new token
      adminToken   = res.body.accessToken;
      adminRefresh = res.body.refreshToken; // rotated
    });

    it('POST /auth/logout — succeeds and invalidates refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refreshToken: adminRefresh })
        .expect(204);

      // Refresh with revoked token should now fail
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: adminRefresh })
        .expect(401);

      // Re-login to get fresh tokens for remaining tests
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@demo.com', password: 'Demo1234!' });
      adminToken   = res.body.accessToken;
      adminRefresh = res.body.refreshToken;
    });

    it('GET /content without token — 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/content').expect(401);
    });
  });

  // ── Editorial workflow ────────────────────────────────────────────────────────
  describe('Editorial workflow', () => {
    it('POST /content — editor creates draft (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'E2E Test Article', body: 'Article body for testing.' })
        .expect(201);

      expect(res.body.status).toBe('draft');
      contentId = res.body.id;
    });

    it('POST /content — viewer cannot create content (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer Article', body: 'Should be rejected.' })
        .expect(403);
    });

    it('GET /content — draft NOT visible in published list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      const ids = res.body.map((c: any) => c.id);
      expect(ids).not.toContain(contentId);
    });

    it('POST /content/:id/submit — editor submits for review (200)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/content/${contentId}/submit`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);

      expect(res.body.status).toBe('pending_review');
    });

    it('PATCH /content/:id/publish — viewer cannot publish (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/content/${contentId}/publish`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('PATCH /content/:id/publish — admin publishes (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/content/${contentId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('published');
    });

    it('GET /content — published item now appears in list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      const ids = res.body.map((c: any) => c.id);
      expect(ids).toContain(contentId);
    });

    it('GET /content/:id — viewer can access published content', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);
    });
  });

  // ── Dashboard + cache ─────────────────────────────────────────────────────────
  describe('Dashboard', () => {
    it('GET /dashboard — returns stats (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalContent');
      expect(res.body).toHaveProperty('publishedContent');
      expect(res.body).toHaveProperty('todayViews');
      expect(res.body).toHaveProperty('cached');
      expect(res.body.cached).toBe(false); // first call is always DB
    });

    it('GET /dashboard — second call returns cached: true', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.cached).toBe(true);
    });
  });

  // ── Programs ──────────────────────────────────────────────────────────────────
  describe('Programs', () => {
    it('POST /programs — admin creates a schedule slot (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title:     'E2E Test Show',
          startTime: '2026-06-15T19:00:00Z',
          endTime:   '2026-06-15T20:00:00Z',
        })
        .expect(201);

      expect(res.body.title).toBe('E2E Test Show');
      programId = res.body.id;
    });

    it('POST /programs — returns 400 when endTime <= startTime', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title:     'Bad Show',
          startTime: '2026-06-15T20:00:00Z',
          endTime:   '2026-06-15T19:00:00Z',
        })
        .expect(400);
    });

    it('GET /programs — returns schedule', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/programs')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    });

    it('PATCH /programs/:id/cancel — admin cancels program (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/programs/${programId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('cancelled');
    });
  });
});