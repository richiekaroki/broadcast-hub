# Sign‑out Redirect Plan

**Goal**: After a user signs out, they should be taken to the public landing page (`http://localhost:3000/`) instead of the login page.

## Current behavior
- `SettingsPage.tsx` defines `handleLogout` which:
  1. Calls `logout()` API.
  2. Dispatches `setAuthenticated(false)`.
  3. Shows a toast.
  4. Navigates to `'/login'`.

## Required change
- Update the navigation target from `'/login'` to `'/'` (the landing route defined in `App.tsx`).

## Steps to implement (for later)
1. Open `apps/web/src/features/settings/SettingsPage.tsx`.
2. Locate `navigate('/login')` inside `handleLogout`.
3. Replace it with `navigate('/')`.
4. Run the app and verify that after signing out the user lands on the landing page.

No other code changes are needed because the landing page is already a public route.
