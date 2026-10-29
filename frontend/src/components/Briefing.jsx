import { Bot, Info, RefreshCw } from "lucide-react";

export default function Briefing({ briefing, source, stale, onRegenerate, loading, inputs }) {
  const paragraphs = (briefing || "").split(/\n{2,}|\n(?=[-•*\d])/).map((p) => p.trim()).filter(Boolean);
  return (
    <section className="panel briefing">
      <div className="panel-head">
        <div>
          <h2><Bot size={18} /> Executive briefing</h2>
          <p className="panel-sub">
            {source === "live" ? "Written by NVIDIA Nemotron via Nebius Token Factory, using only the simulation numbers above." : "Offline summary. The Nemotron briefing appears once the backend is connected."}
          </p>
        </div>
        {stale && (
          <button className="ghost-btn" onClick={onRegenerate} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Update briefing
          </button>
        )}
      </div>
      {stale && <div className="stale-note">Inputs changed since this briefing was written. Numbers on the charts are current.</div>}
      <div className="briefing-body">
        {paragraphs.map((p, i) => <p key={i}>{p.replace(/^[-•*]\s*/, "")}</p>)}
      </div>
      <details className="assumptions">
        <summary><Info size={14} /> Key assumptions behind these numbers</summary>
        <ul>
          <li>Starting stock of {inputs.inventory} units is used first; demand is a constant {inputs.daily_demand} units per day.</li>
          <li>The emergency order arrives in full on day {Number(inputs.emergency_lead_days) + 1}; Split Procurement orders half of it.</li>
          <li>The original supplier resumes on day {Number(inputs.normal_lead_days) + 1} and covers all remaining demand.</li>
          <li>Unmet demand is lost (not back-ordered) and costs the selling price of ${inputs.selling_price} per unit.</li>
          <li>Total cost = emergency spend + lost revenue. Risk score is a transparent heuristic (80% shortage share, 20% budget overrun), not a probability.</li>
          <li>All inputs are synthetic demonstration values. Outputs are model estimates, not predictions of real company performance.</li>
        </ul>
      </details>
    </section>
  );
}
