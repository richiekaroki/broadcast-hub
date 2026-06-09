# PostCSS @import Placement Fix Plan

**Problem**
Vite’s PostCSS processor throws an error:
```
[postcss] @import must precede all other statements
```
The error points to a CSS file where an `@import` statement for Google Fonts is placed **after** other CSS rules. PostCSS (and the CSS spec) require any `@import` rules to appear before any other CSS declarations (except `@charset` or `@layer`).

**Goal**
Move the `@import` line(s) to the top of the file (or to a dedicated imports‑only CSS file) so the build succeeds.

**Steps**
1. Locate the offending stylesheet.
   - Run a grep for the import URL in the `apps/web` directory:
   ```bash
   grep -R "@import url('https://fonts.googleapis.com" -n apps/web
   ```
   - This will return the file path and line numbers.
2. Open the file (use the `read` tool) and verify the surrounding lines. Typical pattern:
   ```css
   .someClass { … }
   ...
   @import url('https://fonts.googleapis.com/...');
   :root { … }
   ```
3. Edit the file:
   - Move the `@import` line to the very first line of the file (or create a separate `fonts.css` containing only the import and ensure it is imported before any other stylesheet).
   - Ensure no other `@import` statements appear after other CSS rules.
4. Re‑run the development server:
   ```bash
   npm run dev
   ```
   The build should now succeed without the PostCSS error.

**Optional Enhancements**
- Consolidate all external font imports into a dedicated `fonts.css` and import that file before your main stylesheet in `main.ts` or the HTML `<head>`.
- If multiple CSS files contain imports, repeat the same rearrangement for each.

**Verification**
- After moving the import, the Vite dev server should start with `VITE vX.Y.Z ready` and display the local URL without errors.
- Check the browser to confirm fonts load correctly.

---
*This plan is stored in the `plans` folder as `postcss_import_plan.md`.*