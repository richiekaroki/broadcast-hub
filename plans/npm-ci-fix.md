# npm ci lock file synchronization plan

1. **Synchronise lock files**
   - Run `npm install` (not `npm ci`) in each workspace (`apps/api` and `apps/web`).
   - This will regenerate the `package-lock.json` files so they match the version ranges declared in `package.json`.

2. **Commit the updated lock files**
   - After the install completes, add & commit the new `package-lock.json` files.
   - The Docker build (which runs `npm ci --omit=dev`) will then succeed because the lock and manifest are in sync.

3. **Check peer‑dependency warnings**
   - The current lock contains newer `ajv`, `json-schema-traverse`, `mongodb`, etc., while some transitive packages still request older versions (e.g., `ajv@6.15.0`).
   - If `npm install` still produces **ERESOLVE** or **npm WARN ERESOLVE** errors, add an **`overrides`** (npm 8+) section to the root `package.json` to force compatible versions, for example:

```json
{
  "overrides": {
    "ajv": "6.15.0",
    "json-schema-traverse": "0.4.1",
    "mongodb": "6.21.0",
    "bson": "6.10.4",
    "mongodb-connection-string-url": "3.0.2",
    "@types/whatwg-url": "11.0.5"
  }
}
```
   - Run `npm install` again so the lock file incorporates these overrides.

4. **Re‑run the Docker build**
   - With the lock now consistent, `docker build …` (or the CI step that runs `npm ci --omit=dev`) should finish without the “lock file … does not satisfy …” errors.

5. **Optional – keep CI fast**
   - Once the lock is stable, you can keep using `npm ci` for CI builds; it will install exactly the versions recorded in the lock file, guaranteeing reproducible builds.

**Next steps**
1. In a terminal, execute:
   ```bash
   cd F:/dev/NestJS/broadcast-hub/apps/api
   npm install
   cd ../../apps/web
   npm install
   ```
2. Review any peer‑dependency warnings. If they appear, add the `overrides` block above (adjust versions if needed) to the root `package.json`, then run `npm install` again.
3. Stage and commit the updated `package-lock.json` files:
   ```bash
   git add apps/api/package-lock.json apps/web/package-lock.json
   git commit -m "Sync lock files – resolve ajv / mongodb version conflicts"
   ```
4. Re‑run your Docker build or CI pipeline.

If further version conflicts arise after the install, provide the exact error messages and we can refine the `overrides` block accordingly.
