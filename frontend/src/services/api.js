// API client for the DecisionTwin backend.
//
// Endpoints (from the team plan, Section 4D):
//   POST /api/analyze-crisis        body: CrisisInput            -> AIResponse { strategies: [...] }
//   POST /api/simulate/supply-chain body: supply-chain inputs     -> { crisis_type, mode, simulation_results }
//   POST /api/executive-briefing    body: { crisis, simulation_results } -> { briefing: "..." }
//
// If the backend can't be reached, each call falls back to the offline
// preview so the dashboard keeps working. The UI shows which source was used.

import { simulateSupplyChain, offlineBriefing } from "./demoEngine.js";
import { STRATEGY_IDS, STRATEGY_META } from "./strategies.js";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TIMEOUT_MS = 45000;

async function post(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new BackendUnavailable(`Non-JSON response from ${path}`);
    }
    if (!res.ok) {
      // 404 = endpoint not built yet; 5xx = backend down or the model call
      // failed (e.g. Nebius unreachable). Fall back instead of breaking the demo.
      // 400/422 are real input errors and are shown to the user.
      if (res.status === 404 || res.status >= 500) throw new BackendUnavailable(`${path} returned ${res.status}`);
      throw new Error(data.detail || data.error || `${path} failed with HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new BackendUnavailable(`${path} timed out`);
    if (err instanceof TypeError) throw new BackendUnavailable(`Could not reach ${path}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export class BackendUnavailable extends Error {}

/** Build the CrisisInput object Zainab's AIService expects. */
export function buildCrisisInput(inputs, description) {
  return {
    scenario_name: "Primary Supplier Disruption",
    description,
    constraints: [
      `Emergency budget: $${Number(inputs.budget).toLocaleString()}`,
      `Planning horizon: ${inputs.horizon_days} days`,
      `Current inventory: ${inputs.inventory} units; daily demand: ${inputs.daily_demand} units`,
      `Original supplier recovers in ${inputs.normal_lead_days} days; emergency supplier delivers in ${inputs.emergency_lead_days} days`,
    ],
    objectives: ["Minimise total estimated cost", "Avoid stockouts where affordable"],
  };
}

function fallbackStrategies() {
  return STRATEGY_IDS.map((id) => ({
    strategy_id: id,
    title: STRATEGY_META[id].name,
    description: STRATEGY_META[id].fallbackDescription,
    risk_analysis: null,
  }));
}

export async function analyzeCrisis(crisis) {
  try {
    const data = await post("/api/analyze-crisis", crisis);
    return { strategies: data.strategies, source: "live" };
  } catch (err) {
    if (err instanceof BackendUnavailable) return { strategies: fallbackStrategies(), source: "offline" };
    throw err;
  }
}

export async function simulate(inputs) {
  try {
    const data = await post("/api/simulate/supply-chain", inputs);
    return { ...data, source: "live" };
  } catch (err) {
    if (err instanceof BackendUnavailable) return { ...simulateSupplyChain(inputs), source: "offline" };
    throw err;
  }
}

export async function executiveBriefing(crisis, simulationResults, inputs, strategies) {
  try {
    const data = await post("/api/executive-briefing", { crisis, simulation_results: simulationResults });
    return { briefing: data.briefing ?? data, source: "live" };
  } catch (err) {
    if (err instanceof BackendUnavailable) {
      return { briefing: offlineBriefing(inputs, simulationResults, strategies), source: "offline" };
    }
    throw err;
  }
}
