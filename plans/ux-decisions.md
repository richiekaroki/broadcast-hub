# Wam Broadcast Hub, UX Decisions Log

This document captures key UX decisions made during development. Use as reference when building features or reviewing design.

---

## 1. First Impression for Unregistered Users

**Question:** What should an unregistered user see first when they land on your app?

**Decision:** Both merged, landing page with live data section embedded.

**Rationale:**
- A pure marketing page ("Features", "How It Works", "Pricing") doesn't convince anyone. Users don't know what the product is yet.
- A separate preview page adds an extra click before users see value.
- Merging both means users see the product in action immediately, real content, real schedules, real stats, alongside the value proposition.

**Implementation:**
- Hero section with tagline
- Live data section showing published content + broadcast schedule (fetched from API)
- Stats strip showing real platform metrics
- CTA to sign up

---

## 2. Target Audience

**Question:** What's the primary audience for this app?

**Decision:** Both, radio/TV stations AND digital publishers.

**Rationale:**
- The app handles content editorial workflow (draft → review → publish) which applies to digital publishers.
- The app handles broadcast scheduling (programs, time slots, live status) which applies to radio/TV stations.
- The copy and features should speak to both use cases without being confusing.

**Implementation:**
- Hero tagline: "Content distribution that actually ships", generic enough for both
- Features section covers both editorial workflow AND broadcast scheduling
- Avoid niche jargon (don't say "on-air" or "articles" exclusively)

---

## 3. Preview Data Strategy

**Question:** Should the public preview show real data from your API or demo data?

**Decision:** Real data with fallback to demo data.

**Rationale:**
- Real data proves the app actually works, builds trust.
- If the API is down or empty, the page shouldn't look broken.
- Fallback demo data ensures a good first impression even in development.

**Implementation:**
- Fetch from public API endpoints (`/content`, `/programs`, `/dashboard`)
- If API returns empty or errors, fall back to curated demo data
- Show loading skeletons during fetch

---

## 4. Navbar for Unregistered Users

**Question:** Does the navbar give too much info for unregistered users?

**Decision:** Simplify, Logo + Preview anchor + Sign In button.

**Rationale:**
- "Features", "How It Works", "Pricing" are marketing pages that don't help users understand the product.
- The live preview section on the homepage IS the features/how it works.
- Pricing can be mentioned in the CTA section if needed.

**Implementation:**
- Navbar: Logo | "Live Preview" (anchor link to data section) | "Sign In" button
- No dropdown menus, no marketing links
- On mobile: hamburger menu with same minimal options

---

## 5. Mobile-First Responsive Design

**Question:** Have you considered both mobile and web design for the UX?

**Decision:** Mobile-first design for all pages.

**Rationale:**
- Many users will discover the app on their phones.
- The dashboard, content management, and live feed must work on small screens.
- The landing page/preview must be scannable on mobile.

**Implementation:**
- Landing page: single column on mobile, stats stack vertically, content cards stack
- Dashboard: collapsible sidebar, metrics row wraps, content table scrolls horizontally
- Live Feed: stream cards stack vertically, stat cards stack
- All interactive elements have minimum 44px touch targets

---

## 6. Auth Flow, Role Assignment

**Question:** How does a user get assigned a role? Who decides who is admin?

**Decision:**
- New users (magic link or Google OAuth) are always assigned `viewer` role by default.
- Only existing database records have higher roles (set via seed script).
- No self-promotion mechanism, roles must be set by database admin.
- Future: Add admin user management panel for `super_admin` to promote users.

**Current Implementation:**
- `UserRole` enum: `SUPER_ADMIN`, `EDITOR`, `PRESENTER`, `ADVERTISER`, `VIEWER`
- Default role: `VIEWER` (set in `user.entity.ts` and `UsersService.create()`)
- Google OAuth always creates as `VIEWER`
- Roles stored in JWT, enforced via `RolesGuard`

---

## 7. Content Workflow

**Question:** What's the editorial workflow?

**Decision:** 4-state machine with role enforcement.

```
DRAFT → PENDING_REVIEW → PUBLISHED
                    ↓
               REJECTED (with reason)
```

**Rules:**
- `EDITOR` or `SUPER_ADMIN` can create content (starts as `draft`)
- `EDITOR` can submit for review (`draft` → `pending_review`)
- `SUPER_ADMIN` can publish (`pending_review` → `published`)
- `SUPER_ADMIN` can reject with reason (`pending_review` → `rejected`)
- Visibility: `SUPER_ADMIN` and `EDITOR` see all content; others see only `published`

---

## 8. Real-Time vs Polling

**Question:** Should the app use WebSockets or polling?

**Decision:** Polling for now (15-30 second intervals), WebSocket as future enhancement.

**Rationale:**
- Polling is simpler to implement and debug.
- For a CMS/broadcast management app, 15-30 second freshness is acceptable.
- WebSocket would be needed for true real-time collaboration (multiple editors editing same content).

**Current Implementation:**
- Dashboard stats: `refetchInterval: 30_000`
- Programs/live feed: `refetchInterval: 15_000`
- Traffic chart: static demo data (placeholder for WebSocket)

---

## 9. Error Handling UX

**Question:** What should happen when API calls fail?

**Decision:** Show error state with retry button, not just loading skeletons.

**Rationale:**
- Users need to know something went wrong.
- A retry button gives them control.
- Silent failures frustrate users.

**Implementation:**
- React Query `error` state → show error message + retry button
- Toast notifications for transient errors
- ErrorBoundary for uncaught React errors

---

## 10. Public Preview Page

**Question:** How do we entice undecided users to sign up?

**Decision:** Show the product in action, live content, live schedule, real stats.

**Rationale:**
- Seeing is believing. A marketing page can't compete with actually seeing the product work.
- The preview should feel like a "free sample" — enough to show value, not enough to replace signing up.

**Implementation:**
- Merged into landing page (see Decision #1)
- Fetches real data from public API endpoints
- Shows published content cards, broadcast schedule, platform stats
- CTA: "Start Free Trial" → redirects to login

---

## 11. Naming Convention

**Question:** What should the app be called?

**Decision:** "Wam Broadcast Hub", used consistently everywhere.

**Locations:**
- Frontend: Landing page, Sidebar, Login page, Page titles
- Backend: Email templates, Swagger docs, Seed script, E2E tests
- HTML: `<title>`, meta description

---

## 12. Accessibility Standards

**Question:** What accessibility level are we targeting?

**Decision:** WCAG 2.1 AA compliance.

**Implementation:**
- Color contrast: minimum 4.5:1 for normal text
- Focus-visible states on all interactive elements
- ARIA labels on buttons, inputs, modals
- Skip-to-main-content link
- Semantic HTML (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`)
- `prefers-reduced-motion` media query to disable animations

---

## 13. News Aggregation (Future Feature)

**Question:** Should we integrate real-world news APIs alongside the CMS?

**Decision:** Yes, as a hybrid model. Aggregated news is a research tool for editors, not a replacement for user-generated content.

**Rationale:**
- Media teams need to see what's happening to create their own content.
- Aggregated news saves editors time (no copy-pasting from news sites).
- The CMS stays the core product. Aggregation is a feature, not a second product.
- Published content is always original (your voice, your angle).

**How it works:**
1. Editor opens the app and sees a "News Feed" tab with real-world news from external APIs.
2. Finds a story worth covering.
3. Clicks "Create draft from this" which pulls the headline and summary into the CMS.
4. Writes their own take or local angle.
5. Goes through the normal editorial workflow.
6. Publishes.

**Technical implementation:**
- New module: `apps/api/src/content/aggregator.service.ts` (fetches from NewsAPI, Guardian, RSS)
- New entity field: `source: 'internal' | 'aggregated'` on content
- Aggregated content lives in a "Research" tab, not mixed with published content.
- Editors can pull aggregated stories into the editorial workflow with one click.

**Identity stays clear:** "Wam Broadcast Hub helps media teams research, create, and publish content, all from one newsroom."

**Not:** "Here's a CMS and here's some news."

---

## 14. Writing Style Guide

**Question:** How should we write copy for the app?

**Decision:** No em dashes (—) to join words. Use commas, periods, or restructure sentences instead.

**Rationale:**
- Em dashes can look unprofessional in UI copy.
- Simpler punctuation is easier to read on screens.
- Consistency across all user-facing text.

**Examples:**
- Bad: "Built for teams that ship fast, all from one dashboard"
- Good: "Built for teams that ship fast, all from one dashboard"
- Bad: "Draft, review, publish, and analyze, all from one dashboard"
- Good: "Draft, review, publish, and analyze from one dashboard"
