# Plan: UI Review – Wam Broadcast Hub Web

**Scope**: Review of the `apps/web` UI codebase, focusing on architecture, accessibility, responsiveness, performance, and code quality.

**Last updated**: 2026-08-09

---

## 1. General Architecture & Patterns
| Observation | Impact / Risk | Status |
|---|---|---|
| Heavy inline-style usage | Makes theming and reuse harder | Partially addressed — key components extracted to CSS classes |
| Duplicate `MetricCard` | Increases bundle size | **FIXED** — consolidated to single `src/components/MetricCard.tsx` |
| `mobile.css` targets missing class names | Mobile breakpoints never trigger | **FIXED** — `.layout-root`, `.metrics-row`, `.bottom-row` added to JSX |
| No error state UI for React Query | Users see blank area on error | Pending — needs error boundaries per query |
| Tables lack horizontal scroll wrapper | Overflow on small screens | Pending — needs `.table-wrapper` on ContentTable |

---

## 2. Accessibility (a11y)
| Issue | Status |
|---|---|
| SVG icons without `aria-hidden` | **FIXED** — all decorative icons now have `aria-hidden="true"` |
| Buttons missing `type="button"` | **FIXED** — all buttons have explicit type |
| No `<main>` element on landing page | **FIXED** — `<main id="main-content">` wraps primary content |
| Missing `aria-label` on search input | **FIXED** — `aria-label="Search content"` added |
| Missing ARIA on modals | **FIXED** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` added |
| Missing focus-visible styles | **FIXED** — global `focus-visible` ring added to CSS |
| No skip-to-content link | **FIXED** — `.skip-link` added to landing page |
| No `prefers-reduced-motion` | **FIXED** — media query disables animations |
| Color contrast below WCAG AA | **FIXED** — `--text-secondary` and `--text-tertiary` brightened |
| Login page emoji icons | **FIXED** — replaced with SVG icons |
| LiveFeed emoji icons | **FIXED** — replaced with SVG icons in stat cards and action buttons |
| ContentPage delete button emoji | **FIXED** — replaced with SVG trash icon |
| ContentPage empty state emoji | **FIXED** — replaced with SVG document icon |
| DashboardPage search emoji | **FIXED** — replaced with SVG search icon |
| Sidebar logo emoji | **FIXED** — replaced with SVG layers icon |
| AuthVerifyPage error/loading emojis | **FIXED** — replaced with SVG icons |
| Seed script emoji | **FIXED** — removed from console output |
| Email template emoji | **FIXED** — removed from HTML |

---

## 3. Responsiveness & Mobile Experience
| Issue | Status |
|---|---|
| MobileSidebar not used in layout | **FIXED** — `DashboardLayout` imports `MobileSidebar` |
| Metrics row doesn't wrap on mobile | **FIXED** — `.metrics-row` class added with flex-wrap |
| Landing page not mobile-first | **FIXED** — responsive CSS for `.lp-*` classes added |
| Live preview grid not responsive | **FIXED** — `.lp-preview-grid` stacks on mobile |
| Escape key doesn't close mobile sidebar | **FIXED** — keyboard handler added |
| Mobile sidebar backdrop not keyboard-accessible | **FIXED** — `role="button"`, `tabIndex` added |

---

## 4. Performance & Best Practices
| Issue | Status |
|---|---|
| Route-level code splitting | **DONE** — all pages lazy-loaded via `React.lazy()` |
| Sidebar memoized with `useCallback` | **DONE** — logout handler wrapped in `useCallback` |
| ContentPage counts optimized | **DONE** — single-pass `useMemo` reduce |
| LiveFeedPage streams memoized | **DONE** — `useMemo` wrapping demo data |
| MetricCard wrapped in `React.memo` | **DONE** |
| ContentTable wrapped in `React.memo` | **DONE** |
| localStorage cached in `api/client.ts` | **DONE** — module-level cache vars |
| localStorage keys versioned | **DONE** — `accessToken:v1`, `refreshToken:v1` |

---

## 5. Auth & Data Integrity
| Issue | Status |
|---|---|
| OAuthCallback role replacement bug | **FIXED** — removed `.replace('_', ' ')` |
| AuthVerifyPage hardcoded viewer role | **FIXED** — now decodes JWT for actual role |
| Hardcoded `userName: 'Richard Karoki'` | **FIXED** — derives from email in JWT |
| Hardcoded demo emails in LoginPage | **FIXED** — removed |
| Hardcoded demo credentials in SettingsPage | **FIXED** — removed |

---

## 6. Branding & UX
| Issue | Status |
|---|---|
| App name "BroadcastHub" inconsistent | **FIXED** — renamed to "Wam Broadcast Hub" everywhere |
| Landing page shows too much marketing fluff | **FIXED** — simplified navbar (Logo + Live Preview + Sign In) |
| No live preview for undecided users | **FIXED** — merged landing + preview with real API data + fallback |
| Landing page doesn't target both audiences | **FIXED** — copy speaks to radio/TV AND digital publishers |

---

## 7. Remaining Items
| Priority | Action |
|---|---|
| **Medium** | Add error state UI for React Query calls (toast with retry) |
| **Medium** | Wrap ContentTable's `<table>` with horizontal scroll wrapper |
| **Medium** | Fix pagination (currently decorative, non-functional) |
| **Medium** | Fix search (currently non-functional) |
| **Low** | Move static data/constants outside component functions |
| **Low** | Add admin user management panel for role promotion |

---

### Overall Assessment

The UI has been significantly improved since the initial review:

**Completed:**
- All accessibility issues (ARIA, focus states, contrast, semantic HTML, skip-to-content)
- Mobile responsiveness (sidebar, metrics, landing page, live preview)
- Auth bugs (role handling, hardcoded values)
- Branding consistency (Wam Broadcast Hub everywhere)
- Emoji-to-SVG icon migration
- Landing page merged with live preview for undecided users

**Pending:**
- Error state UI for failed API calls
- Non-functional pagination and search
- Admin user management panel
