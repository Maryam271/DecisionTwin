# DecisionTwin Frontend (Member 3)

React + Vite dashboard for the supply-chain disruption workflow.

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Requires Node.js 18 or newer.

Production build: `npm run build` (output in `frontend/dist/`).

## How it connects to the backend

All calls live in `frontend/src/services/api.js`.

| Endpoint | Request body | Expected response |
|---|---|---|
| `POST /api/analyze-crisis` | `CrisisInput` (`scenario_name`, `description`, `constraints`, `objectives`) from `backend/schemas.py` | `AIResponse`: `{ "strategies": [{ "strategy_id", "title", "description", "risk_analysis" }] }` |
| `POST /api/simulate/supply-chain` | The supply-chain fields from `backend/simulation/validator.py`: `inventory`, `daily_demand`, `selling_price`, `emergency_unit_cost`, `emergency_quantity`, `emergency_lead_days`, `normal_lead_days`, `budget`, `horizon_days` | The return value of `run_simulation("supply_chain", data)`: `{ "crisis_type", "mode", "simulation_results": { "<strategy_id>": {...} } }` |
| `POST /api/executive-briefing` | `{ "crisis": CrisisInput, "simulation_results": {...} }` | `{ "briefing": "<text>" }` |

- In development, Vite forwards `/api/*` to `http://localhost:8000` (see `vite.config.js`). Set `VITE_BACKEND_URL` to change it.
- For a deployed frontend, set `VITE_API_URL` to the public backend URL before `npm run build` (see `.env.example`).
- The FastAPI app must allow CORS from the frontend's domain if they are hosted separately.

**Optional:** if the simulation response includes `daily_results` per strategy (rows with `day`, `opening_inventory`, `delivered`, `demand_served`, `unmet_demand`, `ending_inventory`), the charts use it directly. Otherwise the frontend derives the daily series with the same rules as `supply_chain.py`.

## Offline preview

If the backend is not reachable (404, 5xx, timeout or network error), the dashboard keeps working:

- Strategies fall back to the three default names and descriptions.
- Numbers come from `src/services/demoEngine.js`, a line-by-line JavaScript mirror of `backend/simulation/supply_chain.py`. It was checked against the Python engine on 301 random input sets with zero differences.
- The briefing is a plain summary built from those numbers.

The header shows **Offline preview** or **Live backend** so it is always clear where the numbers came from. Input errors from the backend (400/422) are shown to the user, not hidden.

## What the dashboard shows

1. **Crisis inputs**: editable fields with sliders and validation. "Live what-if" re-runs the simulation (not the AI) as sliders move.
2. **Executive summary**: lowest-cost strategy, savings vs. the worst option, total cost, shortage units, first stockout day, budget status.
3. **Strategy cards**: AI title, description and risk analysis; demand-served ring; cost, lost units, stockout day; rank; budget chip. Click a card to focus it.
4. **Decision landscape**: isometric 3D towers for total cost (split into emergency spend and lost revenue), lost units, stockout days or risk score.
5. **Inventory over time**: step chart per strategy with a day scrubber and stock "tanks" for the chosen day.
6. **Cost breakdown**: stacked bars with the budget line.
7. **Trade-off profile**: radar chart, every axis scored so bigger is better.
8. **Executive briefing**: Nemotron text plus the key model assumptions; flags when inputs changed after it was written.
9. **Daily results table**: per strategy, with shortage and delivery days highlighted.

## Files

```
frontend/
  index.html, vite.config.js, package.json, .env.example
  src/App.jsx                 page layout, state, loading/error/empty states
  src/styles.css              design system and responsive layout
  src/components/             InputPanel, Hero, StrategyCards, DecisionLandscape,
                              InventoryChart, CostChart, TradeoffRadar, Briefing, DailyTable
  src/services/api.js         backend calls with fallback
  src/services/demoEngine.js  offline mirror of the Python simulation
  src/services/strategies.js  strategy IDs, names and colours
  src/data/defaults.js        default scenario (same values as test_engine.py)
  src/data/mockResults.json   sample response for development
```

All values are synthetic demonstration data. Outputs are estimates from the simulation model, not predictions of real company performance.
