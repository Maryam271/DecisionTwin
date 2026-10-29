
from backend.simulation.cash_flow import simulate_cash_flow

sample_crisis = {
    "initial_cash": 80000,
    "monthly_income": 20000,
    "monthly_expenses": 35000,
    "months": 6
}

results = simulate_cash_flow(sample_crisis)

print("\nDECISIONTWIN - CASH FLOW SIMULATION")
print("=" * 45)

for strategy, metrics in results.items():
    print(f"\nStrategy: {strategy}")

    for key, value in metrics.items():
        print(f"  {key}: {value}")

print("\nCash flow simulation completed successfully!")
