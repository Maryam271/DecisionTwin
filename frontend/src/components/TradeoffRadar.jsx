import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";
import { STRATEGY_IDS, STRATEGY_META } from "../services/strategies.js";
import { totalCost } from "./format.js";

// Every axis is scaled 0-100 where HIGHER IS BETTER, so the biggest shape wins.
export default function TradeoffRadar({ results, budget, hidden, horizon }) {
  const maxCost = Math.max(...STRATEGY_IDS.map((id) => totalCost(results[id])), 1);
  const maxSpend = Math.max(Number(budget), ...STRATEGY_IDS.map((id) => results[id].emergency_spend_usd), 1);
  const axes = [
    { axis: "Low cost", f: (r) => 100 * (1 - totalCost(r) / maxCost) + 5 },
    { axis: "Demand served", f: (r) => r.production_capacity_pct },
    { axis: "Low risk", f: (r) => 100 - r.operational_risk_score * 10 },
    { axis: "Budget headroom", f: (r) => 100 * (1 - r.emergency_spend_usd / maxSpend) },
    { axis: "Fewer stockout days", f: (r, h) => 100 * (1 - r.stockout_days / h) },
  ];
  const data = axes.map(({ axis, f }) => {
    const row = { axis };
    for (const id of STRATEGY_IDS) row[id] = Math.max(0, Math.round(f(results[id], Math.max(1, Number(horizon)))));
    return row;
  });

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Trade-off profile</h2>
          <p className="panel-sub">Scored 0–100, bigger is better on every axis.</p>
        </div>
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--line)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--text)" }} formatter={(v, id) => [v, STRATEGY_META[id].name]} />
            {STRATEGY_IDS.filter((id) => !hidden[id]).map((id) => (
              <Radar key={id} dataKey={id} stroke={STRATEGY_META[id].color} fill={STRATEGY_META[id].color} fillOpacity={0.18} strokeWidth={2} animationDuration={500} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
