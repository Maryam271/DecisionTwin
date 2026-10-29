import { Trophy, TrendingDown, PackageX, CalendarX, Wallet } from "lucide-react";
import { STRATEGY_META } from "../services/strategies.js";
import { money, num, totalCost } from "./format.js";

export default function Hero({ results, rankedIds, firstStockout, strategies }) {
  const bestId = rankedIds[0];
  const best = results[bestId];
  const worst = results[rankedIds[2]];
  const meta = STRATEGY_META[bestId];
  const title = strategies.find((s) => s.strategy_id === bestId)?.title || meta.name;
  const saving = totalCost(worst) - totalCost(best);

  const tiles = [
    { icon: TrendingDown, label: "Total estimated cost", value: money(totalCost(best)), sub: "spend + lost revenue" },
    { icon: PackageX, label: "Shortage units", value: num(best.lost_units), sub: `${best.production_capacity_pct}% demand served` },
    { icon: CalendarX, label: "First stockout", value: firstStockout[bestId] ? `Day ${firstStockout[bestId]}` : "None", sub: `${best.stockout_days} stockout day(s)` },
    { icon: Wallet, label: "Budget status", value: best.within_budget ? "Within" : "Over", sub: `${money(best.emergency_spend_usd)} spent`, tone: best.within_budget ? "good" : "bad" },
  ];

  return (
    <section className="hero" style={{ "--accent": meta.color, "--accent-glow": meta.glow }}>
      <div className="hero-main">
        <span className="eyebrow"><Trophy size={14} /> Lowest-cost strategy</span>
        <h2>{title}</h2>
        <p>
          Saves <strong>{money(saving)}</strong> compared with the most expensive option
          {" "}({strategies.find((s) => s.strategy_id === rankedIds[2])?.title || STRATEGY_META[rankedIds[2]].name}).
        </p>
      </div>
      <div className="kpi-grid">
        {tiles.map(({ icon: Icon, label, value, sub, tone }) => (
          <div className={`kpi ${tone || ""}`} key={label}>
            <Icon size={16} className="kpi-icon" />
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
            <span className="kpi-sub">{sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
