// Strategy IDs agreed in the team contract (backend/schemas.py and
// backend/simulation/supply_chain.py both use these exact keys).
export const STRATEGY_IDS = ["emergency_sourcing", "wait_for_recovery", "split_procurement"];

export const STRATEGY_META = {
  emergency_sourcing: {
    name: "Emergency Sourcing",
    short: "Emergency",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
    icon: "Zap",
    fallbackDescription: "Buy the full emergency quantity from a faster, more expensive supplier.",
  },
  wait_for_recovery: {
    name: "Wait for Recovery",
    short: "Wait",
    color: "#818cf8",
    glow: "rgba(129, 140, 248, 0.35)",
    icon: "Hourglass",
    fallbackDescription: "Spend nothing extra and wait for the original supplier to resume deliveries.",
  },
  split_procurement: {
    name: "Split Procurement",
    short: "Split",
    color: "#2dd4bf",
    glow: "rgba(45, 212, 191, 0.35)",
    icon: "GitFork",
    fallbackDescription: "Order half the emergency quantity to balance cost against shortage risk.",
  },
};
