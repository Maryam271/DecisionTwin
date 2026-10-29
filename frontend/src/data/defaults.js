// Default scenario. Values match Member 2's engine test (test_engine.py)
// so the dashboard and the Python engine can be checked against each other.
// These are synthetic demonstration values, not real company data.
export const DEFAULT_INPUTS = {
  inventory: 1400,
  daily_demand: 100,
  selling_price: 50,
  emergency_unit_cost: 35,
  emergency_quantity: 1000,
  emergency_lead_days: 7,
  normal_lead_days: 25,
  budget: 40000,
  horizon_days: 30,
};

export const DEFAULT_DESCRIPTION =
  "Our primary component supplier has halted deliveries after a factory shutdown. " +
  "We need to decide whether to buy from an expensive emergency supplier, wait for recovery, or split our order.";

// Field definitions drive the input form (labels, units, slider ranges).
export const FIELDS = [
  { key: "inventory", label: "Current inventory", unit: "units", min: 0, max: 5000, step: 50, group: "Stock & demand" },
  { key: "daily_demand", label: "Daily demand", unit: "units/day", min: 1, max: 500, step: 5, group: "Stock & demand" },
  { key: "selling_price", label: "Selling price", unit: "$/unit", min: 0, max: 200, step: 1, group: "Stock & demand" },
  { key: "normal_lead_days", label: "Original supplier recovery", unit: "days", min: 0, max: 60, step: 1, integer: true, group: "Suppliers" },
  { key: "emergency_lead_days", label: "Emergency delivery time", unit: "days", min: 0, max: 30, step: 1, integer: true, group: "Suppliers" },
  { key: "emergency_unit_cost", label: "Emergency unit cost", unit: "$/unit", min: 0, max: 200, step: 1, group: "Suppliers" },
  { key: "emergency_quantity", label: "Emergency order size", unit: "units", min: 0, max: 5000, step: 50, group: "Suppliers" },
  { key: "budget", label: "Emergency budget", unit: "$", min: 0, max: 150000, step: 1000, group: "Budget & horizon" },
  { key: "horizon_days", label: "Simulation horizon", unit: "days", min: 1, max: 90, step: 1, integer: true, group: "Budget & horizon" },
];
