import { useRef, useState } from "react";
import { Zap, Hourglass, GitFork, AlertTriangle, ChevronDown } from "lucide-react";
import { STRATEGY_IDS, STRATEGY_META } from "../services/strategies.js";
import { money, num, totalCost } from "./format.js";

const ICONS = { Zap, Hourglass, GitFork };

function Ring({ pct, color }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="ring" role="img" aria-label={`${pct}% demand served`}>
      <circle cx="32" cy="32" r={r} stroke="var(--line)" strokeWidth="6" fill="none" />
      <circle
        cx="32" cy="32" r={r} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset .6s ease" }}
      />
      <text x="32" y="36" textAnchor="middle" className="ring-text">{Math.round(pct)}%</text>
    </svg>
  );
}

function TiltCard({ children, active, color, glow, onClick }) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0 });
  const move = (e) => {
    const b = ref.current.getBoundingClientRect();
    setT({ x: ((e.clientY - b.top) / b.height - 0.5) * -8, y: ((e.clientX - b.left) / b.width - 0.5) * 10 });
  };
  return (
    <div
      ref={ref}
      className={`strategy-card ${active ? "active" : ""}`}
      style={{ "--accent": color, "--accent-glow": glow, transform: `perspective(900px) rotateX(${t.x}deg) rotateY(${t.y}deg)` }}
      onMouseMove={move}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-pressed={active}
    >
      {children}
    </div>
  );
}

export default function StrategyCards({ results, strategies, rankedIds, selected, setSelected, firstStockout }) {
  const [open, setOpen] = useState(null);
  const maxCost = Math.max(...STRATEGY_IDS.map((id) => totalCost(results[id])), 1);

  return (
    <section className="cards">
      {STRATEGY_IDS.map((id) => {
        const r = results[id];
        const meta = STRATEGY_META[id];
        const ai = strategies.find((s) => s.strategy_id === id) || {};
        const Icon = ICONS[meta.icon];
        const rank = rankedIds.indexOf(id) + 1;
        return (
          <TiltCard key={id} active={selected === id} color={meta.color} glow={meta.glow} onClick={() => setSelected(id)}>
            <div className="card-top">
              <span className="card-icon"><Icon size={18} /></span>
              <span className={`rank rank-${rank}`}>#{rank}</span>
            </div>
            <h3>{ai.title || meta.name}</h3>
            <p className="card-desc">{ai.description || meta.fallbackDescription}</p>

            <div className="card-metrics">
              <Ring pct={r.production_capacity_pct} color={meta.color} />
              <div className="card-stats">
                <div><span>Total cost</span><strong>{money(totalCost(r))}</strong></div>
                <div><span>Lost units</span><strong>{num(r.lost_units)}</strong></div>
                <div><span>First stockout</span><strong>{firstStockout[id] ? `Day ${firstStockout[id]}` : "None"}</strong></div>
              </div>
            </div>

            <div className="cost-bar" title="Total cost relative to the most expensive strategy">
              <div style={{ width: `${(totalCost(r) / maxCost) * 100}%` }} />
            </div>

            <div className="chips">
              <span className={`chip ${r.within_budget ? "good" : "bad"}`}>{r.within_budget ? "Within budget" : "Over budget"}</span>
              <span className="chip">Risk {r.operational_risk_score}/10</span>
              <span className="chip">Relief day {r.recovery_time_days}</span>
            </div>

            {ai.risk_analysis && (
              <>
                <button className="risk-toggle" onClick={(e) => { e.stopPropagation(); setOpen(open === id ? null : id); }}>
                  <AlertTriangle size={13} /> AI risk analysis <ChevronDown size={14} className={open === id ? "rot" : ""} />
                </button>
                {open === id && <p className="risk-text">{ai.risk_analysis}</p>}
              </>
            )}
          </TiltCard>
        );
      })}
    </section>
  );
}
