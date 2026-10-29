import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { STRATEGY_IDS, STRATEGY_META } from "../services/strategies.js";
import { num } from "./format.js";

function Tank({ value, max, color, label, short }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="tank">
      <div className="tank-body">
        <div className="tank-fill" style={{ height: `${pct}%`, background: color }} />
        {short > 0 && <span className="tank-alert">−{num(short)}</span>}
      </div>
      <span className="tank-val">{num(value)}</span>
      <span className="tank-label">{label}</span>
    </div>
  );
}

export default function InventoryChart({ daily, strategies, hidden, setHidden }) {
  const horizon = daily[STRATEGY_IDS[0]].length;
  const [day, setDay] = useState(1);
  useEffect(() => { if (day > horizon) setDay(horizon); }, [horizon]);

  const data = Array.from({ length: horizon }, (_, i) => {
    const row = { day: i + 1 };
    for (const id of STRATEGY_IDS) row[id] = daily[id][i].ending_inventory;
    return row;
  });
  const maxInv = Math.max(...data.flatMap((r) => STRATEGY_IDS.map((id) => r[id])), 1);
  const title = (id) => strategies.find((s) => s.strategy_id === id)?.title || STRATEGY_META[id].name;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Inventory over time</h2>
          <p className="panel-sub">Units left at the end of each day. Click a name to hide or show it.</p>
        </div>
        <div className="legend-btns">
          {STRATEGY_IDS.map((id) => (
            <button key={id} className={hidden[id] ? "off" : ""} style={{ "--c": STRATEGY_META[id].color }} onClick={() => setHidden((h) => ({ ...h, [id]: !h[id] }))}>
              <i /> {STRATEGY_META[id].short}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {STRATEGY_IDS.map((id) => (
                <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STRATEGY_META[id].color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={STRATEGY_META[id].color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted)" tickLine={false} fontSize={12} />
            <YAxis stroke="var(--muted)" tickLine={false} fontSize={12} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip
              contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--text)" }}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(v, id) => [`${num(v)} units`, title(id)]}
            />
            <ReferenceLine x={day} stroke="var(--text)" strokeDasharray="4 4" />
            {STRATEGY_IDS.filter((id) => !hidden[id]).map((id) => (
              <Area key={id} type="stepAfter" dataKey={id} stroke={STRATEGY_META[id].color} strokeWidth={2.5} fill={`url(#g-${id})`} animationDuration={500} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="scrubber">
        <label htmlFor="day-scrub">Scrub to day <strong>{day}</strong></label>
        <input id="day-scrub" type="range" min={1} max={horizon} value={day} onChange={(e) => setDay(Number(e.target.value))} />
      </div>
      <div className="tanks">
        {STRATEGY_IDS.map((id) => {
          const r = daily[id][day - 1];
          return <Tank key={id} value={r.ending_inventory} max={maxInv} color={STRATEGY_META[id].color} label={STRATEGY_META[id].short} short={r.unmet_demand} />;
        })}
      </div>
    </section>
  );
}
