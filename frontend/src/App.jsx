import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertCircle, Cpu, Wifi, WifiOff, Play } from "lucide-react";

import InputPanel, { validate } from "./components/InputPanel.jsx";
import Hero from "./components/Hero.jsx";
import StrategyCards from "./components/StrategyCards.jsx";
import DecisionLandscape from "./components/DecisionLandscape.jsx";
import InventoryChart from "./components/InventoryChart.jsx";
import CostChart from "./components/CostChart.jsx";
import TradeoffRadar from "./components/TradeoffRadar.jsx";
import DailyTable from "./components/DailyTable.jsx";
import Briefing from "./components/Briefing.jsx";

import { DEFAULT_INPUTS, DEFAULT_DESCRIPTION } from "./data/defaults.js";
import { analyzeCrisis, simulate, executiveBriefing, buildCrisisInput } from "./services/api.js";
import { dailySeries } from "./services/demoEngine.js";
import { STRATEGY_IDS } from "./services/strategies.js";

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [strategies, setStrategies] = useState([]);
  const [sim, setSim] = useState(null); // { simulation_results, source, inputs, daily_results? }
  const [briefing, setBriefing] = useState(null); // { briefing, source }
  const [briefingStale, setBriefingStale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("split_procurement");
  const [hidden, setHidden] = useState({});
  const [liveWhatIf, setLiveWhatIf] = useState(true);
  const [sources, setSources] = useState({});

  const errors = useMemo(() => validate(inputs), [inputs]);

  const runAll = useCallback(async () => {
    if (Object.keys(errors).length) return;
    setLoading(true);
    setError(null);
    const snapshot = { ...inputs };
    try {
      const crisis = buildCrisisInput(snapshot, description);
      const [ai, s] = await Promise.all([analyzeCrisis(crisis), simulate(snapshot)]);
      setStrategies(ai.strategies);
      setSim({ ...s, inputs: snapshot });
      const b = await executiveBriefing(crisis, s.simulation_results, snapshot, ai.strategies);
      setBriefing(b);
      setBriefingStale(false);
      setSources({ ai: ai.source, sim: s.source, briefing: b.source });
    } catch (err) {
      setError(err.message || "Something went wrong while running the analysis.");
    } finally {
      setLoading(false);
    }
  }, [inputs, description, errors]);

  const regenerateBriefing = async () => {
    if (!sim) return;
    setBriefingLoading(true);
    try {
      const crisis = buildCrisisInput(sim.inputs, description);
      const b = await executiveBriefing(crisis, sim.simulation_results, sim.inputs, strategies);
      setBriefing(b);
      setBriefingStale(false);
      setSources((s) => ({ ...s, briefing: b.source }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBriefingLoading(false);
    }
  };

  // Live what-if: re-run only the simulation (not the AI) shortly after inputs change.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!sim || !liveWhatIf || Object.keys(errors).length) return;
    const snapshot = { ...inputs };
    const t = setTimeout(async () => {
      try {
        const s = await simulate(snapshot);
        setSim({ ...s, inputs: snapshot });
        setSources((src) => ({ ...src, sim: s.source }));
        setBriefingStale(true);
      } catch (err) {
        setError(err.message);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [inputs, liveWhatIf]);

  const results = sim?.simulation_results;

  // Daily series: use the backend's daily_results if it sends them,
  // otherwise derive them with the same rules as the Python engine.
  const daily = useMemo(() => {
    if (!sim) return null;
    const out = {};
    for (const id of STRATEGY_IDS) {
      out[id] = sim.daily_results?.[id] || results?.[id]?.daily_results || dailySeries(sim.inputs, id);
    }
    return out;
  }, [sim]);

  const firstStockout = useMemo(() => {
    if (!daily) return {};
    return Object.fromEntries(STRATEGY_IDS.map((id) => [id, daily[id].find((r) => r.unmet_demand > 0)?.day ?? null]));
  }, [daily]);

  const rankedIds = useMemo(
    () => (results ? [...STRATEGY_IDS].sort((a, b) => results[b].financial_impact_usd - results[a].financial_impact_usd) : STRATEGY_IDS),
    [results]
  );

  const live = sources.sim === "live";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Activity size={18} /></span>
          <div>
            <h1>DecisionTwin</h1>
            <span>Test critical business decisions before they become costly mistakes</span>
          </div>
        </div>
        <div className="status">
          {sim && (
            <span className={`pill ${live ? "good" : "warn"}`} title={live ? "Numbers come from the Python simulation API" : "Backend not reachable: using the built-in mirror of the Python engine"}>
              {live ? <Wifi size={13} /> : <WifiOff size={13} />} {live ? "Live backend" : "Offline preview"}
            </span>
          )}
          <span className={`pill ${sources.ai === "live" ? "good" : ""}`} title={sources.ai === "offline" ? "AI endpoint not reachable: showing default strategy names" : "Strategies and briefing from NVIDIA Nemotron via Nebius Token Factory"}>
            <Cpu size={13} /> NVIDIA Nemotron · Nebius{sources.ai === "offline" ? " (not connected)" : ""}
          </span>
        </div>
      </header>

      <div className="layout">
        <InputPanel
          inputs={inputs}
          setInputs={setInputs}
          description={description}
          setDescription={setDescription}
          onRun={runAll}
          onReset={() => { setInputs(DEFAULT_INPUTS); setDescription(DEFAULT_DESCRIPTION); }}
          loading={loading}
          liveWhatIf={liveWhatIf}
          setLiveWhatIf={setLiveWhatIf}
          errors={errors}
        />

        <main className="main">
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              <div><strong>Analysis failed.</strong> {error}</div>
              <button className="ghost-btn" onClick={runAll}>Try again</button>
            </div>
          )}

          {!results && !loading && (
            <section className="empty">
              <div className="empty-art" aria-hidden="true">
                {[0, 1, 2].map((i) => <span key={i} style={{ "--i": i }} />)}
              </div>
              <h2>Your supplier just went down. What now?</h2>
              <p>Set the crisis conditions on the left, then run the analysis. Nemotron proposes three strategies, the Python engine simulates each one day by day, and you compare the outcomes here.</p>
              <button className="run-btn inline" onClick={runAll}><Play size={18} /> Run the sample scenario</button>
            </section>
          )}

          {loading && !results && (
            <section className="loading-state">
              <div className="skeleton hero-sk" />
              <div className="sk-row"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
              <p>Asking Nemotron for strategies and simulating 3 futures…</p>
            </section>
          )}

          {results && daily && (
            <div className={`results ${loading ? "refreshing" : ""}`}>
              <Hero results={results} rankedIds={rankedIds} firstStockout={firstStockout} strategies={strategies} />
              <StrategyCards results={results} strategies={strategies} rankedIds={rankedIds} selected={selected} setSelected={setSelected} firstStockout={firstStockout} />
              <DecisionLandscape results={results} strategies={strategies} selected={selected} setSelected={setSelected} />
              <InventoryChart daily={daily} strategies={strategies} hidden={hidden} setHidden={setHidden} />
              <div className="two-col">
                <CostChart results={results} budget={sim.inputs.budget} />
                <TradeoffRadar results={results} budget={sim.inputs.budget} hidden={hidden} horizon={sim.inputs.horizon_days} />
              </div>
              {briefing && (
                <Briefing briefing={briefing.briefing} source={briefing.source} stale={briefingStale} onRegenerate={regenerateBriefing} loading={briefingLoading} inputs={sim.inputs} />
              )}
              <DailyTable daily={daily} selected={selected} setSelected={setSelected} />
            </div>
          )}
        </main>
      </div>

      <footer className="foot">
        Synthetic demonstration data. Outputs are estimates from the DecisionTwin simulation model, not predictions of real company performance.
      </footer>
    </div>
  );
}
