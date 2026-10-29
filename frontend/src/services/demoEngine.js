// Offline preview engine.
//
// This is a line-by-line JavaScript mirror of Member 2's Python engine
// (backend/simulation/supply_chain.py). It is used ONLY when the FastAPI
// backend is not reachable, so the dashboard can still be demonstrated.
// When the backend is connected, all headline numbers come from Python.
//
// It also produces the day-by-day series (inventory, deliveries, unmet
// demand) that the charts need, using exactly the same daily rules.

import { STRATEGY_IDS } from "./strategies.js";

const round2 = (n) => Math.round(n * 100) / 100;

function orderQuantities(emergencyQuantity) {
  return {
    emergency_sourcing: emergencyQuantity,
    wait_for_recovery: 0,
    split_procurement: emergencyQuantity / 2,
  };
}

/** Daily time series for one strategy, following the Python loop exactly. */
export function dailySeries(inputs, strategyId) {
  const demand = Number(inputs.daily_demand);
  const horizon = Number(inputs.horizon_days || 30);
  const emergencyLead = Number(inputs.emergency_lead_days);
  const normalLead = Number(inputs.normal_lead_days);
  const qty = orderQuantities(Number(inputs.emergency_quantity))[strategyId];

  let stock = Number(inputs.inventory);
  const rows = [];
  for (let day = 0; day < horizon; day++) {
    const opening = stock;
    let delivered = 0;
    if (day === emergencyLead) delivered += qty;
    if (day === normalLead) delivered += demand * horizon;
    stock += delivered;
    const served = Math.min(stock, demand);
    stock -= served;
    rows.push({
      day: day + 1,
      opening_inventory: round2(opening),
      delivered: round2(delivered),
      demand_served: round2(served),
      unmet_demand: round2(demand - served),
      ending_inventory: round2(stock),
    });
  }
  return rows;
}

/** Same output shape as run_simulation("supply_chain", data) in Python. */
export function simulateSupplyChain(inputs) {
  const demand = Number(inputs.daily_demand);
  const horizon = Number(inputs.horizon_days || 30);
  const price = Number(inputs.selling_price);
  const unitCost = Number(inputs.emergency_unit_cost);
  const emergencyLead = Number(inputs.emergency_lead_days);
  const normalLead = Number(inputs.normal_lead_days);
  const budget = Number(inputs.budget);
  const quantities = orderQuantities(Number(inputs.emergency_quantity));

  const results = {};
  for (const id of STRATEGY_IDS) {
    const rows = dailySeries(inputs, id);
    const lostUnits = rows.reduce((s, r) => s + r.unmet_demand, 0);
    const soldUnits = rows.reduce((s, r) => s + r.demand_served, 0);
    const stockoutDays = rows.filter((r) => r.unmet_demand > 0).length;
    const qty = quantities[id];

    const emergencySpend = qty * unitCost;
    const lostRevenue = lostUnits * price;
    const recoveryDays = qty > 0 ? Math.min(emergencyLead, normalLead) : normalLead;
    const capacity = (soldUnits / (demand * horizon)) * 100;
    const shortageRatio = lostUnits / (demand * horizon);
    const budgetOverrun = Math.max(0, emergencySpend - budget) / Math.max(budget, 1);
    const risk = Math.min(10, 10 * (0.8 * shortageRatio + 0.2 * Math.min(budgetOverrun, 1)));

    results[id] = {
      financial_impact_usd: round2(-(emergencySpend + lostRevenue)),
      recovery_time_days: recoveryDays,
      production_capacity_pct: round2(capacity),
      operational_risk_score: round2(risk),
      lost_units: round2(lostUnits),
      emergency_spend_usd: round2(emergencySpend),
      stockout_days: stockoutDays,
      within_budget: emergencySpend <= budget,
    };
  }
  return { crisis_type: "supply_chain", mode: "quantitative", simulation_results: results };
}

/** Plain-language summary used when the AI briefing endpoint is unavailable. */
export function offlineBriefing(inputs, results, strategies) {
  const name = (id) => strategies.find((s) => s.strategy_id === id)?.title || id;
  const ranked = [...STRATEGY_IDS].sort(
    (a, b) => results[b].financial_impact_usd - results[a].financial_impact_usd
  );
  const best = results[ranked[0]];
  const worst = results[ranked[2]];
  const fmt = (n) => `$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const lines = [
    `${name(ranked[0])} has the lowest estimated total impact (${fmt(best.financial_impact_usd)}), ` +
      `keeping ${best.production_capacity_pct}% of demand served with ${best.stockout_days} stockout day(s).`,
    `${name(ranked[2])} is the most expensive outcome at ${fmt(worst.financial_impact_usd)}, ` +
      `driven by ${worst.lost_units.toLocaleString()} units of unmet demand.`,
  ];
  const overBudget = STRATEGY_IDS.filter((id) => !results[id].within_budget);
  if (overBudget.length) {
    lines.push(`Over budget: ${overBudget.map(name).join(", ")}. Emergency spend exceeds $${Number(inputs.budget).toLocaleString()}.`);
  } else {
    lines.push("All three strategies stay within the emergency budget.");
  }
  lines.push("All figures are estimates from the simulation model using synthetic inputs, not predictions of real company performance.");
  return lines.join("\n\n");
}
