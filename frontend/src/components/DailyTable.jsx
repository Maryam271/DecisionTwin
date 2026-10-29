import { useState } from "react";
import { STRATEGY_IDS, STRATEGY_META } from "../services/strategies.js";
import { num } from "./format.js";

export default function DailyTable({ daily, selected, setSelected }) {
  const [onlyEvents, setOnlyEvents] = useState(false);
  const rows = daily[selected].filter((r) => !onlyEvents || r.delivered > 0 || r.unmet_demand > 0);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Daily results</h2>
          <p className="panel-sub">Red rows = demand that could not be met that day.</p>
        </div>
        <div className="seg">
          {STRATEGY_IDS.map((id) => (
            <button key={id} className={selected === id ? "on" : ""} style={selected === id ? { "--seg": STRATEGY_META[id].color } : {}} onClick={() => setSelected(id)}>
              {STRATEGY_META[id].short}
            </button>
          ))}
        </div>
      </div>
      <label className="check">
        <input type="checkbox" checked={onlyEvents} onChange={(e) => setOnlyEvents(e.target.checked)} /> Show only delivery and shortage days
      </label>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Day</th><th>Opening</th><th>Delivered</th><th>Served</th><th>Unmet</th><th>Closing</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} className={r.unmet_demand > 0 ? "short" : r.delivered > 0 ? "delivery" : ""}>
                <td>{r.day}</td>
                <td>{num(r.opening_inventory)}</td>
                <td>{r.delivered > 0 ? `+${num(r.delivered)}` : "—"}</td>
                <td>{num(r.demand_served)}</td>
                <td>{r.unmet_demand > 0 ? num(r.unmet_demand) : "—"}</td>
                <td>{num(r.ending_inventory)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="empty-cell">No delivery or shortage days in this horizon.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
