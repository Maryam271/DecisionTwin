import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell, LabelList } from "recharts";
import { STRATEGY_IDS, STRATEGY_META } from "../services/strategies.js";
import { money, lostRevenue } from "./format.js";

export default function CostChart({ results, budget }) {
  const data = STRATEGY_IDS.map((id) => ({
    id,
    name: STRATEGY_META[id].short,
    spend: results[id].emergency_spend_usd,
    lost: lostRevenue(results[id]),
  }));

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Cost breakdown</h2>
          <p className="panel-sub">Emergency spend vs revenue lost to shortages. Dashed line = budget.</p>
        </div>
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted)" tickLine={false} fontSize={12} />
            <YAxis stroke="var(--muted)" tickLine={false} fontSize={12} tickFormatter={(v) => money(v, { compact: true })} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,.08)" }}
              contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--text)" }}
              formatter={(v, k) => [money(v), k === "spend" ? "Emergency spend" : "Lost revenue"]}
            />
            <ReferenceLine y={Number(budget)} stroke="var(--bad)" strokeDasharray="6 4" label={{ value: "Budget", fill: "var(--bad)", fontSize: 11, position: "insideTopRight" }} />
            <Bar dataKey="spend" stackId="c" radius={[0, 0, 6, 6]} animationDuration={500}>
              {data.map((d) => <Cell key={d.id} fill={STRATEGY_META[d.id].color} />)}
            </Bar>
            <Bar dataKey="lost" stackId="c" radius={[6, 6, 0, 0]} animationDuration={500}>
              {data.map((d) => <Cell key={d.id} fill={STRATEGY_META[d.id].color} fillOpacity={0.4} />)}
              <LabelList valueAccessor={(d) => d.spend + d.lost} position="top" formatter={(v) => money(v, { compact: true })} fill="var(--text)" fontSize={12} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
