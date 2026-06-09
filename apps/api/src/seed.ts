/**
 * BroadcastHub — Database Seed Script  (v2 — fixes applied)
 * -----------------------------------------------------------
 * Run:  npx ts-node -r tsconfig-paths/register src/seed.ts
 *   or: npm run seed   (add script to package.json shown below)
 *
 * package.json script to add:
 *   "seed": "ts-node -r tsconfig-paths/register src/seed.ts"
 *
 * FIX 11: table name corrected content (not contents)
 * FIX 12: seed SQL column list matches actual entity columns
 *         is_active removed (not on entity)
 *         name column added to users INSERT (Fix 1)
 *         author_id added to content INSERT (Fix 2)
 *         authorId branch logic fixed (Fix 5 — was editorUser.id on both branches)
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { connect, model, Schema, disconnect } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ── TypeORM connection ────────────────────────────────────────────────────────
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://bh_user:bh_pass@localhost:5432/broadcasthub',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
});

// ── Inline Mongoose model (no NestJS DI needed in seed) ──────────────────────
const AnalyticsSchema = new Schema(
  { entityType: String, entityId: String, userId: String, action: String, meta: Object },
  { timestamps: true, collection: 'analytics_events' },
);
const AnalyticsEvent = model('AnalyticsEvent', AnalyticsSchema);

// ── Seed data ─────────────────────────────────────────────────────────────────
const DEMO_PASSWORD = 'Demo1234!';

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
  console.log('🌱  BroadcastHub seed starting…\n');

  await AppDataSource.initialize();
  console.log('✅  PostgreSQL connected');

  await connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/broadcasthub');
  console.log('✅  MongoDB connected');

  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  try {
    // FIX 11: correct table name is `content`, not `contents`
    // CASCADE handles the content FK referencing users
    await qr.query(`TRUNCATE TABLE content, users RESTART IDENTITY CASCADE`);
    await AnalyticsEvent.deleteMany({});
    console.log('🗑️   Cleared existing seed data\n');

    // ── Users ──────────────────────────────────────────────────────────────
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const createdUsers: Array<{ id: string; role: string }> = [];

    for (const u of USERS) {
      // FIX 12: column list matches user.entity.ts
      //   ✅ name added     (Fix 1)
      //   ❌ is_active removed  (never on entity)
      const [user] = await qr.query(
        `INSERT INTO users ("id", "name", "email", "password_hash", "role", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id, role`,
        [u.name, u.email, hash, u.role],
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
      // FIX 5: branch logic was editorUser.id on BOTH branches — now correct
      // Published content was authored by the admin; drafts by the editor
      const authorId = c.status === 'draft' ? editorUser.id : adminUser.id;

      // FIX 12: column list matches content.entity.ts
      //   ✅ author_id added   (Fix 2)
      //   ❌ contents → content  (Fix 11)
      const [row] = await qr.query(
        `INSERT INTO content ("id", "title", "body", "status", "author_id", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW() - INTERVAL '${randomInt(1, 10)} days', NOW())
         RETURNING id`,
        [c.title, c.body, c.status, authorId],
      );
      createdContent.push(row);
      console.log(`📄  "${c.title}"  [${c.status}]`);
    }

    // ── Analytics events (MongoDB) ────────────────────────────────────────
    console.log('\n📊  Seeding analytics events…');
    const publishedContent = createdContent.slice(0, 4);
    const events: any[] = [];

    for (const c of publishedContent) {
      for (let i = 0; i < randomInt(40, 120); i++) {
        events.push({
          entityType: 'content', entityId: c.id,
          userId: randomInt(0, 1) === 0 ? viewerUser.id : adminUser.id,
          action: 'view', meta: { source: 'web' },
          createdAt: daysAgo(randomInt(0, 6)),
        });
      }
      for (let i = 0; i < randomInt(5, 20); i++) {
        events.push({
          entityType: 'content', entityId: c.id,
          userId: viewerUser.id,
          action: 'click', meta: { target: 'read-more' },
          createdAt: daysAgo(randomInt(0, 6)),
        });
      }
    }

    await AnalyticsEvent.insertMany(events);
    console.log(`✅  Inserted ${events.length} analytics events`);

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────');
    console.log('🎉  Seed complete!\n');
    console.log('Demo credentials  (password: Demo1234!)');
    console.log('─────────────────────────────────────────');
    for (const u of USERS) {
      console.log(`  ${u.role.padEnd(14)}  ${u.email}`);
    }
    console.log('─────────────────────────────────────────');
    console.log(`\n  Users:    ${USERS.length}`);
    console.log(`  Content:  ${CONTENT_ITEMS.length}`);
    console.log(`  Events:   ${events.length}`);
    console.log('\n🚀  Start the API and visit http://localhost:4000/api/docs\n');

  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  } finally {
    await qr.release();
    await AppDataSource.destroy();
    await disconnect();
  }
}

seed();
