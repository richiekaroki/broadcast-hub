# Plan: UI Review – Broadcast‑Hub Web

**Scope**: Review of the `apps/web` UI codebase, focusing on architecture, accessibility, responsiveness, performance, and code quality.

---

## 1. General Architecture & Patterns
| Observation | Impact / Risk | Suggested Action |
|---|---|---|
| Heavy inline‑style usage – most components build UI entirely with `style={{ … }}` objects. | Makes theming, reuse, and CSS‑in‑JS tooling harder; hinders visual‑regression testing. | Extract shared style objects into constants or CSS modules (e.g., `src/styles/*.module.css`). Keep layout‑critical styles inline only when they depend on runtime data. |
| Duplicate `MetricCard` – a generic version lives in `src/components/MetricCard.tsx`; a near‑identical implementation is re‑declared inside `DashboardPage`. | Increases bundle size, creates maintenance sync issues. | Consolidate to a single component (the one in `components/MetricCard.tsx`) and import it everywhere. |
| `mobile.css` targets class names (`.layout-root`, `.metrics-row`, `.bottom-row`) that are not present in the JSX. | Mobile breakpoints never trigger, leading to poor responsiveness on tablets/phones. | Add the missing class names (e.g., `<div className="layout-root">…`) or refactor the CSS to target existing elements (e.g., `aside`, `.metrics-row` via a wrapper component). |
| Data‑fetching with React‑Query is correctly set up, but query fn references (`fetchDashboardStats`, `fetchContent`) are imported from `api/client`. Ensure error handling UI is present – currently only loading skeletons are shown. | Users might see a blank area on error. | Add an error state UI (e.g., a toast or inline message) for each query. |
| Responsive layout logic – most pages rely on `flex` + custom CSS media queries. The design‑system variables (`var(--color-…)`) are used consistently. | Overall responsiveness is decent, but some elements (e.g., tables) lack a wrapper class (`.table-wrapper`) that enables horizontal scroll on small screens. | Wrap tables (`<table>`) with `<div className="table-wrapper">` in `ContentTable` and any other table components. |

---

## 2. Accessibility (a11y)
| Issue | Why it matters | Quick fix |
|---|---|---|
| SVG icons are inserted directly (`<DashIcon />`) without `aria-hidden` or descriptive `title`. | Screen readers may read raw SVG markup or ignore useful cues. | Add `aria-hidden="true"` to icons or wrap them in `<span aria-label="Dashboard">`. |
| `<button>` elements lack an explicit `type="button"` attribute. | In a form context the default is `type="submit"` which can cause unintended submissions. | Add `type="button"` to all navigation/action buttons. |
| Navigation links (`<a href="#">`) used for mock navigation (e.g., feature cards) have no meaningful `href`. | Keyboard users may be confused; browsers announce “link”. | Replace with `<button>` styled as a link or provide a real anchor (`href="/features"`). |
| Color contrast for text on the orange background (e.g., CTA buttons) depends on `var(--color-orange)` vs. white. Verify contrast ratio ≥ 4.5:1. | WCAG AA compliance. | Run a contrast audit; if needed, adjust the orange variable or text color. |
| No `<main>` element on the landing page; the whole page is a `<div>`. | `<main>` improves landmark navigation. | Wrap the primary content of each page in `<main>` (already done in `DashboardPage`, but missing in `LandingPage`). |
| Missing `<label>` for the search `<input>` in the header. | Assistive tech expects a label. | Add `aria-label="Search"` or associate a hidden `<label>`. |

---

## 3. Responsiveness & Mobile Experience
| Observation | Current behavior | Recommendation |
|---|---|---|
| **Sidebar** – a separate `MobileSidebar` component is provided but the main layout (`AppRoutes`) always renders `<Sidebar>`. | On desktop the sidebar is fine; on mobile the component is never used, causing the overlay to be missing. | Replace `<Sidebar>` with `<MobileSidebar>` in all pages (or create a layout wrapper that swaps based on viewport). |
| **Metrics row** – `DashboardPage` uses `<div style={{ display: 'flex', gap: '14px' }}>` for cards. Mobile CSS expects a `.metrics-row` grid. | Cards stay in a single row on narrow screens, causing overflow. | Add a wrapper `<div className="metrics-row">` and switch `flex` to `grid` using CSS media queries (or change the CSS to target the existing flex container). |
| **Tables** – `ContentTable` uses a plain `<table>` without horizontal overflow wrapper. | On screens `< 640px` the table overflows, breaking layout. | Wrap the `<table>` in `<div className="table-wrapper">`. |
| **Font scaling** – mobile CSS reduces root `font-size` at `max-width: 639px`. The landing page uses large `clamp` values, which still scale, but verify that the hero headline does not overflow on smallest screens. | May cause line‑wraps that break design. | Test on a 360 px viewport; consider adding `word-break: break-word` or adjusting the `clamp` ranges. |

---

## 4. Performance & Best Practices
1. **Static data/constants** (e.g., `TICKER_ITEMS`, `FEATURES`, SVG icon components) are defined inside component bodies. Move them outside the functional component to avoid re‑creation on each render.
2. **Skeletons** are used consistently while loading – good UX. Add a fallback for empty/error states (already done for the “No content yet” row).
3. **CSS Variables** are well‑structured (`--color-…`, `--font-…`). Ensure they are defined in a central `:root` (likely in `index.css`).
4. **Event handlers** for hover effects directly mutate `style` inline. This works but bypasses React’s synthetic event system for styling. Consider using CSS `:hover` or a class toggle via `useState` for smoother updates.
5. **Repeated inline SVG definitions** (`DashIcon`, `LiveIcon`, etc.) could be extracted to a dedicated `icons` folder and memoized with `React.memo`.

---

## 5. Code Quality & Consistency
| Issue | Recommendation |
|---|---|
| Mixed naming conventions: `NavItem` type uses short names (`live`, `content`) while routes use `/live-feed` etc. | Align naming consistently (`liveFeed` or adjust routes). |
| Inline functions inside JSX (e.g., `onMouseEnter={e => …}`) allocate new callbacks each render. | Extract to stable callbacks with `useCallback` where performance matters (e.g., navigation buttons). |
| `Sidebar` calculates the active item via a series of ternary checks; could be simplified with a route‑to‑nav map. |
| The `DashboardPage` defines `const iconBtn` after the component; fine, but keep all style constants grouped for readability. |

---

## 6. Suggested Immediate Action Items
| Priority | Action |
|---|---|
| **High** | Replace all `<Sidebar>` instances with `<MobileSidebar>` (or create a layout wrapper) to enable the mobile overlay. |
| **High** | Add the missing class names (`layout-root`, `.metrics-row`, `.bottom-row`) or modify the CSS selectors so breakpoints actually apply. |
| **High** | Consolidate the duplicated `MetricCard` component into a single source (`src/components/MetricCard.tsx`). |
| **Medium** | Add `type="button"` and appropriate ARIA attributes (`aria-label`, `aria-hidden`) to all interactive elements. |
| **Medium** | Wrap `ContentTable`’s `<table>` with `<div className="table-wrapper">` to enable horizontal scroll on small screens. |
| **Low** | Move static data/constants (ticker, features, SVG icons) outside component functions for better render performance. |
| **Low** | Provide a simple error UI for React‑Query calls (e.g., toast with retry button). |
| **Low** | Verify color contrast for all major UI text (especially orange backgrounds) and adjust CSS variables if below WCAG AA. |

---

### Overall Assessment
The UI implementation is visually rich and leverages a consistent design token system (`var(--color-…)`). Functionality (routing, data loading) works as intended. The main shortcomings are:
* **Responsiveness gaps** – mobile styles are defined but not wired up (missing classes, unused `MobileSidebar`).
* **Duplication** – two versions of `MetricCard` increase bundle size and maintenance overhead.
* **Accessibility** – a few missing ARIA attributes and semantic tags can be easily fixed.

Addressing the high‑priority items will make the app fully responsive, reduce redundancy, and improve accessibility without a large code churn. The remaining suggestions are incremental refinements that will further polish the user experience and code maintainability.
