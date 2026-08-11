/**
 * Wam Broadcast Hub — Database Seed Script  (v3 — Postgres only)
 * -----------------------------------------------------------
 * Run:  npx ts-node -r tsconfig-paths/register src/seed.ts
 *   or: npm run seed
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// ── TypeORM connection ────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || 'postgres://bh_user:bh_pass@localhost:5432/broadcasthub';
const isRemote = dbUrl.includes('neon.tech') || dbUrl.includes('sslmode');

const AppDataSource = new DataSource({
  type:      'postgres',
  url:       dbUrl,
  ssl:       isRemote ? { rejectUnauthorized: false } : false,
  entities:  [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
});

// ── Seed data ─────────────────────────────────────────────────────────────────
const USERS = [
  { name: 'Admin User',      email: 'admin@demo.com',      role: 'super_admin' },
  { name: 'Jane Editor',     email: 'editor@demo.com',     role: 'editor'      },
  { name: 'Mark Presenter',  email: 'presenter@demo.com',  role: 'presenter'   },
  { name: 'Acme Advertiser', email: 'advertiser@demo.com', role: 'advertiser'  },
  { name: 'View Only',       email: 'viewer@demo.com',     role: 'viewer'      },
];

const CONTENT_ITEMS = [
  { title: 'Evening News Bulletin — June 2026',       body: 'Top stories from across Kenya and the region. Markets closed higher, with the NSE gaining 1.2% on the back of strong telecoms earnings.',              status: 'published'     },
  { title: 'Sports Wrap: AFC Champions League Preview', body: 'Gor Mahia face a tough away tie in the AFC Champions League preliminary round. Coach Johnstone Omolo previews the match.',                           status: 'published'     },
  { title: 'Tech Today: AI in Kenyan Healthcare',     body: 'Local startups are deploying machine learning models to improve early diagnosis in rural clinics. We speak to three founders.',                        status: 'published'     },
  { title: 'Weather Forecast: Long Rains Update',     body: 'The Kenya Meteorological Department has issued an advisory for continued heavy rainfall across the highlands through mid-June.',                       status: 'published'     },
  { title: 'Business Spotlight: Nairobi Fintech Scene', body: 'An in-depth look at the fintech companies reshaping payments, lending, and insurance in East Africa.',                                              status: 'pending_review' },
  { title: 'Draft: Cultural Heritage Week Coverage',  body: 'Coverage of the National Cultural Heritage Week events at the Kenya National Museum.',                                                                status: 'draft'         },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Main seed ─────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Wam Broadcast Hub seed starting…\n');

  await AppDataSource.initialize();
  console.log('✅  PostgreSQL connected (Neon)\n');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    await qr.query(`TRUNCATE TABLE analytics_events, content, users, refresh_tokens, magic_link_tokens RESTART IDENTITY CASCADE`);
    console.log('🗑️   Cleared existing seed data\n');

    // ── Users ──────────────────────────────────────────────────────────────
    const createdUsers: Array<{ id: string; role: string }> = [];

    for (const u of USERS) {
      const [user] = await qr.query(
        `INSERT INTO users ("id", "name", "email", "role", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
         RETURNING id, role`,
        [u.name, u.email, u.role],
      );
      createdUsers.push(user);
      console.log(`👤  ${u.email}  (${u.role})`);
    }

    const editorUser = createdUsers.find(u => u.role === 'editor')!;
    const adminUser  = createdUsers.find(u => u.role === 'super_admin')!;
    const viewerUser = createdUsers.find(u => u.role === 'viewer')!;

    // ── Content ────────────────────────────────────────────────────────────
    console.log('');
    const createdContent: Array<{ id: string }> = [];

    for (const c of CONTENT_ITEMS) {
      const authorId = c.status === 'draft' ? editorUser.id : adminUser.id;

      const daysAgo = randomInt(1, 10);
      const [row] = await qr.query(
        `INSERT INTO content ("id", "title", "body", "status", "author_id", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW() - ($5 || ' days')::interval, NOW())
         RETURNING id`,
        [c.title, c.body, c.status, authorId, daysAgo],
      );
      createdContent.push(row);
      console.log(`📄  "${c.title}"  [${c.status}]`);
    }

    // ── Analytics events (Postgres) ────────────────────────────────────────
    console.log('\n📊  Seeding analytics events…');
    const publishedContent = createdContent.slice(0, 4);
    let eventCount = 0;

    for (const c of publishedContent) {
      const viewCount = randomInt(40, 120);
      const clickCount = randomInt(5, 20);

      for (let i = 0; i < viewCount; i++) {
        const userId = randomInt(0, 1) === 0 ? viewerUser.id : adminUser.id;
        const viewDaysAgo = randomInt(0, 6);
        await qr.query(
          `INSERT INTO analytics_events ("id", "entityType", "entityId", "userId", "action", "meta", "createdAt")
           VALUES (gen_random_uuid(), 'content', $1, $2, 'view', '{"source":"web"}', NOW() - ($3 || ' days')::interval)`,
          [c.id, userId, viewDaysAgo],
        );
        eventCount++;
      }

      for (let i = 0; i < clickCount; i++) {
        const clickDaysAgo = randomInt(0, 6);
        await qr.query(
          `INSERT INTO analytics_events ("id", "entityType", "entityId", "userId", "action", "meta", "createdAt")
           VALUES (gen_random_uuid(), 'content', $1, $2, 'click', '{"target":"read-more"}', NOW() - ($3 || ' days')::interval)`,
          [c.id, viewerUser.id, clickDaysAgo],
        );
        eventCount++;
      }
    }

    console.log(`✅  Inserted ${eventCount} analytics events`);

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────');
    console.log('🎉  Seed complete!\n');
    console.log('Auth: Use magic link flow — POST /api/v1/auth/magic-link');
    console.log('─────────────────────────────────────────');
    for (const u of USERS) {
      console.log(`  ${u.role.padEnd(14)}  ${u.email}`);
    }
    console.log('─────────────────────────────────────────');
    console.log(`\n  Users:    ${USERS.length}`);
    console.log(`  Content:  ${CONTENT_ITEMS.length}`);
    console.log(`  Events:   ${eventCount}`);
    console.log('\n🚀  Start the API and visit http://localhost:4000/api/docs\n');

  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seed();
