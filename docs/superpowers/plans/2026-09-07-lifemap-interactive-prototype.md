# LifeMap Interactive Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public static interactive LifeMap prototype under `/lifemap/` in `yoonsang0218-a11y/plugnx-app`.

**Architecture:** Keep domain calculations in `core.mjs`, demo/provider data in `data.mjs`, and UI orchestration in `app.js`. Use a provider-adapter boundary so future crawlers and partner APIs can replace demo data without rewriting the UI.

**Tech Stack:** Static HTML, CSS, ES modules, Leaflet 1.9.4, OpenStreetMap, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-07-lifemap-interactive-prototype-design.md`

## Global Constraints
- All non-live entity values must be labeled DEMO DATA or verification-pending.
- Financial statuses must never imply final approval.
- Calculations must remain deterministic and independent from LLM output.
- User-entered local profile/reviews/imports persist only in localStorage in this prototype.
- Existing exported application routes must not be modified.

---

### Task 1: Deterministic LifeMap calculation engine
**Files:**
- Create: `lifemap/core.mjs`
- Test: `lifemap/tests/core.test.mjs`

**Interfaces:**
- Produces: `calculateHousingMonthlyCost`, `calculateMonthlySurplus`, `calculateMoveGapDays`, `compareMobility`, `getFinanceReadiness`, `aggregateReviews`, `inferEntityKind`.

- [x] Write failing tests for monthly housing cost, surplus, move gap, mobility, financial-readiness language, evidence-weighted review aggregation and imported-entity type inference.
- [x] Run tests and verify they fail because `core.mjs` does not exist.
- [x] Implement the minimum deterministic functions.
- [x] Run `node --test lifemap/tests/core.test.mjs` and verify all pass.

### Task 2: Interactive screen shell and data model
**Files:**
- Create: `lifemap/index.html`
- Create: `lifemap/styles.css`
- Create: `lifemap/data.mjs`
- Test: `lifemap/tests/ui-contract.test.mjs`

**Interfaces:**
- Consumes: core calculation API.
- Produces: DOM contract for six layers, import/profile/review sheets, entity drawer and journey panel.

- [x] Write failing screen-contract tests for required map layers and primary interactive surfaces.
- [x] Verify the tests fail because `index.html` is absent.
- [x] Add responsive full-map shell and demo entity datasets.
- [x] Run all Node tests and verify they pass.

### Task 3: UI orchestration and persistence
**Files:**
- Create: `lifemap/app.js`

**Interfaces:**
- Consumes: `core.mjs`, `data.mjs`.
- Produces: map rendering, layer/filter/search interaction, entity drawer, job-home plan, import demo, review submission and localStorage persistence.

- [x] Implement map marker rendering with fallback behavior.
- [x] Implement job/home selection and journey recalculation.
- [x] Implement profile save/auto-fill demo.
- [x] Implement minimum-input URL/text import as verification-pending demo parser.
- [x] Implement structured Promise→Outcome review submission.
- [x] Implement mobility and finance-precheck layers.
- [x] Run `node --check` on all JavaScript modules and rerun automated tests.

### Task 4: Repository publishing
**Files:**
- Create on feature branch: all `lifemap/*` files plus this plan and spec.

**Interfaces:**
- Produces: public GitHub source and a GitHub Pages-compatible `/lifemap/` route.

- [x] Create feature branch from `main`.
- [x] Upload static prototype and docs.
- [ ] Open PR, inspect diff, and merge after verification.
- [ ] Confirm repository files exist on `main` and share public route/repository link.
