# LifeMap Life Event OS Design

## Goal
Convert the existing category-led LifeMap prototype into a life-event orchestrator where users start from a situation, receive a prioritized next action, and only see execution services that are relevant to that event.

## Product model
LifeMap is the discovery layer. The event engine is the decision layer. Moving, cleaning, storage, temporary stay, used cars, insurance and finance are execution modules. WorkProof, HomeSafe and evidence-backed reviews are the trust layer.

## Primary entry events
- Change job
- Move home
- Commute is difficult
- About to sign a housing contract
- Settle in Korea long-term
- Leave Korea

Each event creates a timeline with current stage, blockers, next best action, relevant providers, and evidence state.

## UX principles
1. Do not expose service categories as the primary navigation.
2. The first screen asks the user what they are trying to do.
3. The top card always answers: what should I do next and why?
4. The timeline reveals only needed modules. Storage is hidden when there is no move gap. Used cars are hidden unless mobility analysis makes them relevant.
5. Advanced map layers remain available in a secondary Explore control.
6. User profile is entered once and reused. Imported company/property URLs and documents minimize manual entry.
7. Reviews are attached to entities and focus on Promise → Outcome facts rather than free-form star ratings.

## Event timeline model
Each timeline item has: `id`, `stage`, `title`, `status`, `reason`, `dueLabel`, `module`, `entityId`, `cta`, `optional`.
Statuses: `done`, `next`, `blocked`, `recommended`, `optional`, `later`.

## Next Best Action rules
- Housing contract selected but HomeSafe score below 80 or property risk is not low → verify housing first.
- Move-out occurs before move-in → storage and temporary stay become recommended.
- Move is active and cleaning is not completed → cleaning becomes a pre-move action.
- Mobility analysis recommends a car → used-car comparison appears after housing is selected.
- Finance readiness is never expressed as approval; only precheck-ready, needs-review, partner-review, or not-yet.
- Mortgage/registration appear only in long-term settlement/asset journeys.

## Execution bundle
The Move event combines moving, storage, temporary stay and cleaning into a single bundle comparison. The UI shows total estimated event cost and convenience, while keeping provider identity and source/evidence explicit.

## Business model surfaces
The UI may label business-model touchpoints without presenting prices as contractual:
- Free Decision Utility: map, job-home comparison, reviews, basic HomeSafe/commute checks.
- Execution Marketplace: moving, storage, cleaning, temporary stay, used-car partner handoff.
- B2B/B2B2C Event Fee: relocation workflow for employers, universities, recruiters.
- Financial Bridge: qualified intent and consented verification data for guarantee/credit/auto/mortgage partners.

## Data architecture
Keep provider adapters separate from the UI. Every imported or partner-sourced value carries source, verification time/evidence level, and confirmation state. The prototype continues to use demo data/localStorage but interfaces must remain replaceable by APIs/Supabase later.

## Non-goals for this iteration
- Real crawling of third-party sites
- Real loan or guarantee decisions
- Real payments or marketplace settlement
- Real provider booking
- Rebuilding existing specialized marketplaces

## Acceptance criteria
- Primary entry is life-event cards, not category navigation.
- A persistent Next Best Action card changes when the selected event or underlying plan changes.
- Timeline hides irrelevant services and reveals required ones based on rules.
- Move bundle displays moving, storage, cleaning and temporary stay only when relevant.
- Mobility card compares transit vs car and exposes used-car recommendations only when relevant.
- Company/housing entity drawer and structured reviews remain usable.
- One-time profile, import demo, map and entity search remain usable.
- All finance language is precheck/readiness language.
- Core rule tests and UI contract tests pass.