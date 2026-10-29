import { useEffect, useRef, useState } from "react";
import { STRATEGY_IDS, STRATEGY_META } from "../services/strategies.js";
import { money, num, totalCost, lostRevenue } from "./format.js";

// Isometric "3D" tower chart. Each strategy is a tower; its height is the
// chosen metric. For cost, the tower is split into emergency spend (solid)
// and lost revenue (lighter top block).

const METRICS = {
  cost: { label: "Total cost", fmt: (v) => money(v, { compact: true }), get: (r) => [r.emergency_spend_usd, lostRevenue(r)] },
  shortage: { label: "Lost units", fmt: (v) => num(v), get: (r) => [r.lost_units] },
  stockout: { label: "Stockout days", fmt: (v) => `${num(v)} d`, get: (r) => [r.stockout_days] },
  risk: { label: "Risk score", fmt: (v) => `${num(v, 1)}/10`, get: (r) => [r.operational_risk_score] },
};

function useAnimatedArray(target) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const init = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 600);
      const e = 1 - Math.pow(1 - t, 3);
      const next = target.map((row, i) => row.map((v, j) => (init[i]?.[j] ?? 0) + (v - (init[i]?.[j] ?? 0)) * e));
      setVal(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [JSON.stringify(target)]);
  return val;
}

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};
const pts = (arr) => arr.map((p) => p.join(",")).join(" ");

function Block({ cx, by, a, b, h0, h1, color, opacity = 1 }) {
  const L = (h) => [cx - a, by - b - h];
  const F = (h) => [cx, by - h];
  const R = (h) => [cx + a, by - b - h];
  const B = (h) => [cx, by - 2 * b - h];
  return (
    <g opacity={opacity}>
      <polygon points={pts([L(h0), F(h0), F(h1), L(h1)])} fill={shade(color, -40)} />
      <polygon points={pts([F(h0), R(h0), R(h1), F(h1)])} fill={shade(color, -80)} />
      <polygon points={pts([L(h1), F(h1), R(h1), B(h1)])} fill={shade(color, 25)} />
    </g>
  );
}

export default function DecisionLandscape({ results, strategies, selected, setSelected }) {
  const [metric, setMetric] = useState("cost");
  const m = METRICS[metric];
  const raw = STRATEGY_IDS.map((id) => m.get(results[id]));
  const anim = useAnimatedArray(raw);
  const max = Math.max(...raw.map((r) => r.reduce((s, v) => s + v, 0)), 1e-9);

  const W = 660, H = 360, maxH = 190, a = 58, b = 29, by = 300;
  const xs = [150, 330, 510];

  return (
    <section className="panel landscape">
      <div className="panel-head">
        <div>
          <h2>Decision landscape</h2>
          <p className="panel-sub">Taller tower = worse outcome. Click a tower to focus that strategy.</p>
        </div>
        <div className="seg" role="tablist">
          {Object.entries(METRICS).map(([k, v]) => (
            <button key={k} role="tab" aria-selected={metric === k} className={metric === k ? "on" : ""} onClick={() => setMetric(k)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="iso" role="img" aria-label={`${m.label} by strategy, isometric chart`}>
        {/* floor */}
        <polygon points={pts([[40, by - 30], [W / 2, by + 50], [W - 40, by - 30], [W / 2, by - 110]])} className="iso-floor" />
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={40 + (W / 2 - 40) * f} y1={by - 30 + 80 * f} x2={W / 2 + (W / 2 - 40) * f} y2={by - 110 + 80 * f} className="iso-grid" />
        ))}
        {STRATEGY_IDS.map((id, i) => {
          const meta = STRATEGY_META[id];
          const vals = anim[i];
          const total = raw[i].reduce((s, v) => s + v, 0);
          let acc = 0;
          const active = selected === id;
          const topH = (vals.reduce((s, v) => s + v, 0) / max) * maxH;
          return (
            <g key={id} className="tower" onClick={() => setSelected(id)} style={{ cursor: "pointer" }}>
              {active && <ellipse cx={xs[i]} cy={by - b} rx={a + 18} ry={b + 10} fill={meta.glow} className="tower-glow" />}
              {vals.map((v, j) => {
                const h0 = (acc / max) * maxH;
                acc += v;
                const h1 = Math.max(h0 + (v > 0 ? 2 : 0), (acc / max) * maxH);
                return <Block key={j} cx={xs[i]} by={by} a={a} b={b} h0={h0} h1={h1} color={meta.color} opacity={j === 1 ? 0.55 : 1} />;
              })}
              {total === 0 && <Block cx={xs[i]} by={by} a={a} b={b} h0={0} h1={2} color={meta.color} />}
              <text x={xs[i]} y={by - 2 * b - topH - 12} textAnchor="middle" className="tower-val">{m.fmt(total)}</text>
              <text x={xs[i]} y={by + 30} textAnchor="middle" className={`tower-label ${active ? "on" : ""}`}>
                {strategies.find((s) => s.strategy_id === id)?.title?.split(" ").slice(0, 3).join(" ") || meta.name}
              </text>
            </g>
          );
        })}
      </svg>
      {metric === "cost" && (
        <div className="legend">
          <span><i className="sw solid" /> Emergency spend</span>
          <span><i className="sw faded" /> Lost revenue from unmet demand</span>
        </div>
      )}
    </section>
  );
}
