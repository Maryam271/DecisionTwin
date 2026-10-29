
# DecisionTwin - Supply Chain Crisis Simulator
# Member 2: Simulation Engine

def simulate_supply_chain(data):
    """
    Simulate three responses to a supply-chain crisis.
    All financial values are in USD.
    """

    inventory = float(data["inventory"])
    daily_demand = float(data["daily_demand"])
    selling_price = float(data["selling_price"])
    emergency_cost = float(data["emergency_unit_cost"])
    emergency_quantity = float(data["emergency_quantity"])
    emergency_lead = int(data["emergency_lead_days"])
    normal_lead = int(data["normal_lead_days"])
    budget = float(data["budget"])
    horizon = int(data.get("horizon_days", 30))

    if daily_demand <= 0 or horizon <= 0:
        raise ValueError("Demand and horizon must be positive")

    if any(x < 0 for x in [
        inventory, selling_price, emergency_cost,
        emergency_quantity, emergency_lead,
        normal_lead, budget
    ]):
        raise ValueError("Inputs cannot be negative")

    strategies = {
        "emergency_sourcing": emergency_quantity,
        "wait_for_recovery": 0,
        "split_procurement": emergency_quantity / 2
    }

    results = {}

    for strategy, order_quantity in strategies.items():
        stock = inventory
        lost_units = 0
        sold_units = 0
        stockout_days = 0

        for day in range(horizon):
            if day == emergency_lead:
                stock += order_quantity

            if day == normal_lead:
                stock += daily_demand * horizon

            available = min(stock, daily_demand)
            stock -= available
            sold_units += available

            shortage = daily_demand - available
            lost_units += shortage

            if shortage > 0:
                stockout_days += 1

        emergency_spend = order_quantity * emergency_cost
        lost_revenue = lost_units * selling_price

        # Simplified incremental financial impact.
        financial_impact = -(emergency_spend + lost_revenue)

        # Recovery time approximated by the first
        # scheduled replenishment available.
        recovery_days = (
            min(emergency_lead, normal_lead)
            if order_quantity > 0
            else normal_lead
        )

        capacity = (
            sold_units / (daily_demand * horizon)
        ) * 100

        # Transparent heuristic, not a statistical risk
        # probability. Higher means more operational risk.
        shortage_ratio = lost_units / (daily_demand * horizon)
        budget_overrun = (
            max(0, emergency_spend - budget) / max(budget, 1)
        )

        risk_score = min(
            10,
            10 * (0.8 * shortage_ratio +
                  0.2 * min(budget_overrun, 1))
        )

        results[strategy] = {
            "financial_impact_usd": round(financial_impact, 2),
            "recovery_time_days": recovery_days,
            "production_capacity_pct": round(capacity, 2),
            "operational_risk_score": round(risk_score, 2),
            "lost_units": round(lost_units, 2),
            "emergency_spend_usd": round(emergency_spend, 2),
            "stockout_days": stockout_days,
            "within_budget": emergency_spend <= budget
        }

    return results
