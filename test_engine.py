
from backend.simulation.engine import run_simulation

print("DECISIONTWIN - ENGINE TEST")
print("=" * 45)

supply_data = {
    "inventory": 1400,
    "daily_demand": 100,
    "selling_price": 50,
    "emergency_unit_cost": 35,
    "emergency_quantity": 1000,
    "emergency_lead_days": 7,
    "normal_lead_days": 25,
    "budget": 40000,
    "horizon_days": 30
}

cash_data = {
    "initial_cash": 80000,
    "monthly_income": 20000,
    "monthly_expenses": 35000,
    "months": 6
}

supply_result = run_simulation(
    "supply_chain", supply_data
)

cash_result = run_simulation(
    "cash_flow", cash_data
)

assert supply_result["mode"] == "quantitative"
assert cash_result["mode"] == "quantitative"

assert len(
    supply_result["simulation_results"]
) == 3

assert len(
    cash_result["simulation_results"]
) == 3

assert (
    cash_result["simulation_results"]
    ["no_action"]["final_cash_usd"]
    == -10000
)

print("Supply-chain simulation: PASSED")
print("Cash-flow simulation: PASSED")

general_result = run_simulation(
    "reputation", {}
)

assert general_result["mode"] == "qualitative"

print("General crisis fallback: PASSED")

try:
    run_simulation("cash_flow", {
        "initial_cash": -100,
        "monthly_income": 1000,
        "monthly_expenses": 500
    })
    raise AssertionError("Negative input was accepted")
except ValueError:
    print("Input validation: PASSED")

print("\nALL ENGINE TESTS PASSED!")
