# PlugNX LifeMap · Life Event OS Prototype

Public static prototype for foreign residents in Korea.

The product is intentionally **not** a category-based super app. Users start from a life event and LifeMap reveals only the next decisions and execution modules that are relevant.

## Primary journeys
- Change job
- Move home
- Commute is difficult
- About to sign a housing contract
- Settle in Korea long-term
- Leave Korea

## Product layers
- **Discovery:** map, company/housing/place search, entity detail
- **Decision:** Next Best Action and event timeline
- **Execution:** moving, storage, temporary stay, cleaning, used-car partner handoff
- **Trust:** WorkProof, HomeSafe, Promise→Outcome reviews
- **Finance:** guarantee/credit/auto/mortgage readiness only; never final approval

## Conditional orchestration examples
- Move-out before move-in → storage + temporary stay appear.
- No move gap → storage and temporary stay remain hidden.
- HomeSafe/risk is weak → verification is prioritized before finance.
- Car does not improve the commute within budget → used-car options remain hidden.
- Long-term settlement → mortgage, valuation and electronic registration are surfaced as later-stage rails.

## Existing prototype capabilities retained
- One-time user profile stored locally
- Company/housing reviews with evidence levels
- URL/text quick-import demo for future crawling/partner ingestion
- Company + home monthly surplus and commute comparison
- Map layer controls under Advanced Explore

## Tests

```bash
node --test lifemap/tests/*.test.mjs
node --check lifemap/app.js
node --check lifemap/core.mjs
node --check lifemap/data.mjs
```

## Production integration boundary
Replace demo data through provider adapters instead of embedding source-specific logic in the UI:
`JobSourceAdapter`, `PropertyContextProvider`, `ReviewProvider`, `MoveProvider`, `MobilityProvider`, `FinanceEligibilityProvider`.

All company, housing, partner, vehicle and financial values in this prototype are fictional/demo unless explicitly marked otherwise.
