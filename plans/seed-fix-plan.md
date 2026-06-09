# Seed Failure Fix Plan

**Problem**: Running `npm run seed` fails with:
```
QueryFailedError: column "password_hash" of relation "users" does not exist
```
The seed script attempts to insert a `password_hash` column that is absent from the current database schema.

---

## 1️⃣ Identify Mismatch
- Open the TypeORM `User` entity (e.g., `apps/api/src/users/user.entity.ts`).
- Verify the column name used for the password field (`password`, `passwordHash`, etc.) and any `@Column({ name: 'password_hash' })` mapping.
- Review migration files in `apps/api/src/migrations` (or `apps/api/migrations`) for the creation of the `users` table. Look for a column named `password_hash`.

## 2️⃣ Choose Fix
### Option A – Add Missing Column
Create a new migration that adds `password_hash` to the `users` table (type `text` or `varchar`).
```ts
await queryRunner.addColumn('users', new TableColumn({
  name: 'password_hash',
  type: 'text',
  isNullable: false,
}));
```
Run the migration (`npm run migration:run`).

### Option B – Align Seed with Existing Schema
If the entity already defines a different column name (e.g., `password` or `passwordHash`), update `apps/api/src/seed.ts` to use that column name instead of `password_hash`.
```ts
// replace password_hash with the correct column name
INSERT INTO users (id, name, email, <correct_column>, role, created_at, updated_at)
```

## 3️⃣ Validate
- Apply the chosen migration (Option A) **or** run the updated seed script (Option B).
- Execute `npm run seed` again.
- Confirm a user record is inserted without errors.

## 4️⃣ Prevent Future Drift
- Ensure all schema changes go through migrations; keep `synchronize: false` in production.
- Add a test that seeds the DB and asserts successful user creation.
- Optionally enable TypeORM’s schema validation in CI to catch mismatches early.

---

**Next Steps**
1. Review the `User` entity and migration files to confirm the current column name.
2. Decide on Option A or Option B.
3. Implement the chosen fix and re‑run the seed.

*No code changes have been applied yet; this file only records the plan.*