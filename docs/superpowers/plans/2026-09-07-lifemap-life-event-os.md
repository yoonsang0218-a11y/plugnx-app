# LifeMap Life Event OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework `/lifemap/` from category navigation into a life-event timeline with Next Best Action and context-driven execution modules.

**Architecture:** Keep the existing static Leaflet prototype and entity/review model. Add deterministic event-planning functions in `core.mjs`, then render event cards, next action, timeline, move bundle, mobility and finance surfaces in `app.js`. Keep map layers as secondary advanced controls.

**Tech Stack:** Static HTML/CSS, ES modules, Leaflet 1.9.4, Node built-in test runner, localStorage.

**Spec:** `docs/superpowers/specs/2026-09-07-lifemap-life-event-os-design.md`

## Global Constraints
- No production financial approval language; only readiness/precheck states.
- Demo/provider data must remain labelled as demo or source-pending.
- Category/service modules must not become primary navigation.
- Existing entity detail, reviews, profile and import flows remain available.
- Core decision logic is deterministic and testable; LLM usage is explanatory/import-only.

---

### Task 1: Event planning rules

**Files:**
- Modify: `lifemap/core.mjs`
- Modify: `lifemap/tests/core.test.mjs`

**Interfaces:**
- Produces: `buildLifeEventPlan({eventType, profile, job, property, mobility, finance})`
- Produces: `getNextBestAction(plan)`
- Produces: `estimateMoveBundle({gapDays, includeCleaning})`

- [ ] **Step 1: Write failing tests** for move gaps revealing storage/temp stay, clean moves hiding storage, commute events revealing mobility, and low HomeSafe prioritizing verification.
- [ ] **Step 2: Run** `node --test lifemap/tests/core.test.mjs` and confirm failures reference missing event-plan functions.
- [ ] **Step 3: Implement minimal deterministic rules** in `core.mjs`.
- [ ] **Step 4: Re-run** the test file and confirm all tests pass.

### Task 2: Life Event shell and timeline UI

**Files:**
- Modify: `lifemap/index.html`
- Modify: `lifemap/styles.css`
- Modify: `lifemap/tests/ui-contract.test.mjs`

**Interfaces:**
- Requires DOM ids: `event-chooser`, `next-action-card`, `event-timeline`, `execution-panel`, `advanced-map-controls`.

- [ ] **Step 1: Add failing UI contract tests** requiring event chooser, next action, timeline and advanced map controls.
- [ ] **Step 2: Run** `node --test lifemap/tests/ui-contract.test.mjs` and verify failure.
- [ ] **Step 3: Replace primary category navigation** with event cards and persistent action/timeline panels while keeping search/map/entity drawer.
- [ ] **Step 4: Re-run** UI contract tests.

### Task 3: Event state and context-driven modules

**Files:**
- Modify: `lifemap/app.js`
- Modify: `lifemap/data.mjs`

**Interfaces:**
- Consumes: event-planning functions from Task 1.
- Produces: `state.activeEventType`, event rendering, action execution, move bundle and mobility scenario rendering.

- [ ] **Step 1: Add event definitions and provider-module metadata** to `data.mjs`.
- [ ] **Step 2: Wire event selection** so changing an event recomputes the plan.
- [ ] **Step 3: Render Next Best Action and timeline** from deterministic plan data.
- [ ] **Step 4: Render execution modules only when their timeline items are relevant.**
- [ ] **Step 5: Move map layer chips into the advanced Explore panel.**

### Task 4: Preserve entity/review/minimum-input flows

**Files:**
- Modify: `lifemap/app.js`
- Modify: `lifemap/index.html`

- [ ] **Step 1: Keep company/housing/place entity cards and drawer accessible from map/search.**
- [ ] **Step 2: Keep Promise → Outcome review entry and aggregate review display.**
- [ ] **Step 3: Keep one-time profile and URL/text import demo flows.**
- [ ] **Step 4: Ensure selecting a company or home updates the event plan immediately.**

### Task 5: Verification and integration

**Files:**
- Modify: `lifemap/README.md`

- [ ] **Step 1: Run** `node --test lifemap/tests/*.test.mjs`.
- [ ] **Step 2: Run** `node --check lifemap/app.js && node --check lifemap/core.mjs && node --check lifemap/data.mjs`.
- [ ] **Step 3: Review diff to ensure only LifeMap/docs changed.**
- [ ] **Step 4: Open PR against `main`, review mergeability, and merge only after verification evidence is recorded.**
