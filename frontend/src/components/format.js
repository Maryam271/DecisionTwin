export const money = (n, opts = {}) => {
  const v = Math.abs(Number(n) || 0);
  if (opts.compact && v >= 1000) {
    return `$${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: v >= 100000 ? 0 : 1 })}k`;
  }
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

export const num = (n, d = 0) => (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: d });

/** Total estimated cost = emergency spend + lost revenue (positive number). */
export const totalCost = (r) => Math.abs(r.financial_impact_usd);
export const lostRevenue = (r) => Math.max(0, totalCost(r) - r.emergency_spend_usd);
