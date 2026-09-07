# PlugNX LifeMap Interactive Prototype

Static public prototype for the foreign-resident Life Asset journey:

`Job → Home → Move → Storage → Mobility → Finance → Asset`

## Included interactions
- Full map with six togglable layers
- Company / housing / community / moving-service entity cards
- Structured Promise→Outcome reviews with evidence levels
- One-time user profile and localStorage persistence
- URL/text quick import demo for future crawling/partner ingestion
- Job + home monthly-surplus comparison
- Move-gap and storage/temporary-stay signal
- Transit vs used-car mobility scenario
- Guarantee / credit / auto / mortgage readiness as precheck only

## Run tests

```bash
node --test lifemap/tests/*.test.mjs
node --check lifemap/app.js
```

## Production integration boundary
Replace demo data using provider adapters rather than embedding API logic into the UI:
`JobSourceAdapter`, `PropertyContextProvider`, `ReviewProvider`, `MoveProvider`, `MobilityProvider`, `FinanceEligibilityProvider`.

All company, housing, partner, vehicle and financial values in this prototype are fictional/demo unless explicitly marked otherwise.
