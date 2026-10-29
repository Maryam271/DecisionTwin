import { Play, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { FIELDS } from "../data/defaults.js";

const groups = [...new Set(FIELDS.map((f) => f.group))];

export function validate(inputs) {
  const errors = {};
  for (const f of FIELDS) {
    const v = inputs[f.key];
    if (v === "" || v === null || Number.isNaN(Number(v))) errors[f.key] = "Enter a number";
    else if (Number(v) < 0) errors[f.key] = "Cannot be negative";
    else if (f.integer && !Number.isInteger(Number(v))) errors[f.key] = "Whole number only";
    else if ((f.key === "daily_demand" || f.key === "horizon_days") && Number(v) === 0) errors[f.key] = "Must be above zero";
  }
  return errors;
}

export default function InputPanel({ inputs, setInputs, description, setDescription, onRun, onReset, loading, liveWhatIf, setLiveWhatIf, errors }) {
  const update = (key, value) => setInputs((prev) => ({ ...prev, [key]: value === "" ? "" : Number(value) }));

  return (
    <aside className="panel input-panel">
      <div className="panel-head">
        <h2>Crisis inputs</h2>
        <button className="ghost-btn" onClick={onReset} title="Restore default scenario">
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <label className="field-label" htmlFor="crisis-desc">Describe the crisis</label>
      <textarea
        id="crisis-desc"
        className="crisis-text"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {groups.map((g) => (
        <fieldset key={g} className="field-group">
          <legend>{g}</legend>
          {FIELDS.filter((f) => f.group === g).map((f) => (
            <div className={`field ${errors[f.key] ? "has-error" : ""}`} key={f.key}>
              <div className="field-row">
                <label htmlFor={f.key}>{f.label}</label>
                <div className="num-wrap">
                  <input
                    id={f.key}
                    type="number"
                    min={f.min}
                    step={f.step}
                    value={inputs[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                  <span className="unit">{f.unit}</span>
                </div>
              </div>
              <input
                type="range"
                aria-label={`${f.label} slider`}
                min={f.min}
                max={Math.max(f.max, Number(inputs[f.key]) || 0)}
                step={f.step}
                value={Number(inputs[f.key]) || 0}
                onChange={(e) => update(f.key, e.target.value)}
              />
              {errors[f.key] && <span className="error-text">{errors[f.key]}</span>}
            </div>
          ))}
        </fieldset>
      ))}

      <label className="toggle">
        <input type="checkbox" checked={liveWhatIf} onChange={(e) => setLiveWhatIf(e.target.checked)} />
        <span className="toggle-track"><span className="toggle-thumb" /></span>
        <span>Live what-if: re-simulate as I move sliders</span>
      </label>

      <button className="run-btn" onClick={onRun} disabled={loading || Object.keys(errors).length > 0}>
        {loading ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
        {loading ? "Analysing…" : "Run AI analysis + simulation"}
      </button>
      <p className="hint"><Sparkles size={12} /> Nemotron proposes the strategies and writes the briefing. Python calculates every number.</p>
    </aside>
  );
}
