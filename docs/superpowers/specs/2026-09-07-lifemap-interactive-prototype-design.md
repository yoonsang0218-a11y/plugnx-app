# LifeMap Interactive Prototype Design

## Goal
Build a public, interactive LifeMap prototype that unifies foreign-resident work, housing, move/storage, mobility, finance and asset-readiness flows on one map while minimizing repeated user data entry.

## Product principle
The map is the acquisition UI. The durable product is an entity-and-event graph linking person → visa → worksite → income → home → move → mobility → finance → outcome.

## Core screens
1. Full-viewport map with layer controls for jobs, housing, community, move/storage, mobility and finance.
2. Entity list and entity detail drawer for companies, homes, community places and move partners.
3. Structured Promise→Outcome reviews with evidence levels L0–L3.
4. One-time user profile stored locally for repeated calculations.
5. Quick import panel that accepts a URL/text and demonstrates future crawl/partner adapters with minimum input.
6. My Plan panel combining selected work + home into monthly surplus, move gap, mobility recommendation and finance precheck statuses.

## Data architecture
Every entity preserves source, verification/evidence level and update semantics. Production integration should replace demo arrays through provider interfaces without changing page UI:
- JobSourceAdapter
- PropertyContextProvider
- ReviewProvider
- MoveProvider
- MobilityProvider
- FinanceEligibilityProvider

## Review model
Reviews are not primarily free-text star reviews. They store promiseMatch, rating, evidenceLevel and structured outcomes. Verified evidence receives more weight in aggregate views.

## Financial-safety rule
The prototype never labels a loan, guarantee, auto loan or mortgage as approved. It uses precheck-ready, needs-review, partner-review or not-yet. Final decisions belong to licensed financial/guarantee providers.

## Demo-data rule
All fictional company, housing, provider and product values must remain explicitly labeled DEMO DATA or sample/verification-pending.

## Technical design
No build pipeline. Static HTML/CSS/ES modules to fit the existing exported GitHub Pages repository. Leaflet + OpenStreetMap tiles are loaded from public CDNs, with a non-map fallback so the rest of the prototype remains usable when map resources are unavailable.

## Acceptance criteria
- Six map layers exist and are interactive.
- Company and housing entities expose structured reviews.
- Job and home selection update a shared journey plan.
- Move-out/move-in dates produce a move-gap calculation.
- Mobility compares transit vs sample vehicle economics.
- Finance is shown only as precheck/readiness.
- URL/text import adds a verification-pending entity with minimal user input.
- Profile and locally entered reviews persist in localStorage.
- Demo/source status is visible in UI.
