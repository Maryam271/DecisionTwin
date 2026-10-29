
from backend.simulation.supply_chain import simulate_supply_chain

sample_crisis = {
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

results = simulate_supply_chain(sample_crisis)

print("\nDECISIONTWIN - SIMULATION RESULTS")
print("=" * 45)

for strategy, metrics in results.items():
    print(f"\nStrategy: {strategy}")

    for key, value in metrics.items():
        print(f"  {key}: {value}")

print("\nSimulation completed successfully!")
