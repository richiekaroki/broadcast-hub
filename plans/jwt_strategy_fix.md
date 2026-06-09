# Plan: Fix JwtStrategy secret loading

**Root cause**
`JwtStrategy` reads `JWT_SECRET` from `ConfigService`. The `ConfigModule` is initialized with only `{ isGlobal: true }`, so it looks for a `.env` file in `apps/api`. The actual `.env` resides in the repository root, causing `process.env.JWT_SECRET` to be undefined and resulting in the error:

```
TypeError: JwtStrategy requires a secret or key
```

**Fix**
1. In `apps/api/src/app.module.ts` change the `ConfigModule.forRoot` call:
```ts
ConfigModule.forRoot({ isGlobal: true })
```
   to:
```ts
ConfigModule.forRoot({
  isGlobal: true,
  // Look for .env in the current folder and, if not found, one level up (the repo root)
  envFilePath: ['.env', '../.env'],
})
```
2. Save and restart the server (`npm run start:dev`).

After this change `ConfigService` will correctly read `JWT_SECRET` (and other variables) from the root `.env`, eliminating the error.