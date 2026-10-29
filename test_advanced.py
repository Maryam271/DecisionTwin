
from backend.simulation.engine import run_simulation

def expect_error(crisis_type, data):
    try:
        run_simulation(crisis_type, data)
    except ValueError:
        return True
    return False

# Test 1: Missing required data
assert expect_error("cash_flow", {
    "initial_cash": 10000
})

# Test 2: Negative expenses
assert expect_error("cash_flow", {
    "initial_cash": 10000,
    "monthly_income": 5000,
    "monthly_expenses": -1000
})

# Test 3: Zero daily demand
assert expect_error("supply_chain", {
    "inventory": 100,
    "daily_demand": 0,
    "selling_price": 50,
    "emergency_unit_cost": 30,
    "emergency_quantity": 100,
    "emergency_lead_days": 5,
    "normal_lead_days": 15,
    "budget": 5000
})

# Test 4: Unsupported crisis
result = run_simulation("cybersecurity", {})
assert result["mode"] == "qualitative"

# Test 5: Cash-flow scenario sensitivity
base = {
    "initial_cash": 80000,
    "monthly_income": 20000,
    "monthly_expenses": 35000,
    "months": 6
}

result1 = run_simulation("cash_flow", base)

improved = {**base, "monthly_expenses": 25000}
result2 = run_simulation("cash_flow", improved)

cash1 = result1["simulation_results"]["no_action"]["final_cash_usd"]
cash2 = result2["simulation_results"]["no_action"]["final_cash_usd"]

assert cash2 > cash1

print("ALL ADVANCED TESTS PASSED!")
