
# DecisionTwin - Central Simulation Engine
# Member 2: Simulation Engine

from backend.simulation.supply_chain import (
    simulate_supply_chain
)

from backend.simulation.cash_flow import (
    simulate_cash_flow
)

from backend.simulation.validator import (
    validate_inputs
)


def run_simulation(crisis_type, data):
    """
    Execute the appropriate crisis simulation.

    Returns a JSON-compatible dictionary.
    """

    if crisis_type not in ("supply_chain", "cash_flow"):
        return {
            "crisis_type": crisis_type,
            "mode": "qualitative",
            "simulation_results": {},
            "message": (
                "No quantitative simulation is available "
                "for this crisis type."
            )
        }

    validated_data = validate_inputs(crisis_type, data)

    if crisis_type == "supply_chain":
        results = simulate_supply_chain(validated_data)

    else:
        results = simulate_cash_flow(validated_data)

    return {
        "crisis_type": crisis_type,
        "mode": "quantitative",
        "simulation_results": results
    }
