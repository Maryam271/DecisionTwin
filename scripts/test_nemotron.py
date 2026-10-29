'''Smoke test script for the Nebius Nemotron integration.

This script is intended for developers. It:
1. Loads environment variables from a .env file located at the project root reliably.
2. Verifies that NEBIUS_API_KEY, NEBIUS_ENDPOINT and NEBIUS_MODEL are present and not placeholder values.
3. Aborts clearly BEFORE any network request if credentials are missing or are placeholders.
4. Never prints or exposes the API key.
5. Builds a valid ``CrisisInput`` example matching backend schemas for Primary Supplier Disruption.
6. Calls the AIService to obtain strategies adhering to the contract.
7. Prints strategies and an executive briefing where all demonstration simulation metrics are labeled as synthetic.
'''

import os
import sys
import json
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# 1. Load .env reliably from the project root
# ---------------------------------------------------------------------------
dotenv_path = PROJECT_ROOT / ".env"
if dotenv_path.is_file():
    load_dotenv(dotenv_path)
else:
    # Also attempt standard search if not directly at PROJECT_ROOT
    load_dotenv()

# ---------------------------------------------------------------------------
# 2. Validate credentials before making any network calls (No Leaks!)
# ---------------------------------------------------------------------------
required_vars = ["NEBIUS_API_KEY", "NEBIUS_ENDPOINT", "NEBIUS_MODEL"]
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    print(f"[FAIL] LIVE API: NOT VERIFIED. Missing required environment variables: {', '.join(missing)}.")
    print("       Please create a .env file from .env.example with your actual Nebius Token Factory credentials.")
    sys.exit(0)

# Check for placeholder values without leaking sensitive content
placeholder_patterns = [
    "YOUR_API_KEY",
    "YOUR_NEBIUS",
    "NEBIUS_ENDPOINT",
    "NEBIUS_MODEL",
    "EXAMPLE",
]

api_key = os.getenv("NEBIUS_API_KEY", "").strip()
endpoint = os.getenv("NEBIUS_ENDPOINT", "").strip()
model = os.getenv("NEBIUS_MODEL", "").strip()

has_placeholder = False
for name, val in [("NEBIUS_API_KEY", api_key), ("NEBIUS_ENDPOINT", endpoint), ("NEBIUS_MODEL", model)]:
    upper_val = val.upper()
    if any(pat in upper_val for pat in placeholder_patterns) or val == "":
        print(f"[FAIL] LIVE API: NOT VERIFIED. {name} appears to be a placeholder or empty.")
        has_placeholder = True

if has_placeholder:
    print("       Exiting before making any network requests to prevent wasted calls or credential errors.")
    sys.exit(0)

# ---------------------------------------------------------------------------
# 3. Build valid CrisisInput matching backend/schemas.py (Primary Supplier Disruption)
# ---------------------------------------------------------------------------
from backend.schemas import CrisisInput
from backend.ai_service import AIService, generate_executive_briefing

def run_smoke_test():
    example_crisis = CrisisInput(
        scenario_name="Primary Supplier Disruption",
        description="A Tier-1 semiconductor supplier has declared bankruptcy, halting microprocessor deliveries and threatening the primary assembly line.",
        constraints=[
            "Budget cap: $3,000,000 contingency allocation",
            "Regulatory compliance required for alternative suppliers",
            "Maximum lead time threshold: 30 days"
        ],
        objectives=[
            "Maintain at least 80% production capacity during disruption",
            "Secure an alternative certified supplier for critical microprocessors",
            "Minimize long-term cost escalation"
        ]
    )

    print("\n[INFO] Crisis Input initialized:")
    print(f"  * Scenario: {example_crisis.scenario_name}")
    print(f"  * Description: {example_crisis.description}")
    print(f"  * Objectives: {len(example_crisis.objectives)} defined")
    print(f"  * Constraints: {len(example_crisis.constraints)} defined")

    # ---------------------------------------------------------------------------
    # 4. Invoke AIService to obtain strategies
    # ---------------------------------------------------------------------------
    try:
        service = AIService()
        print("\n[ACTION] Requesting crisis strategies from Nebius Nemotron...")
        response = service.get_strategies(example_crisis)
        print("[SUCCESS] Strategies successfully returned and validated:")
        for idx, strat in enumerate(response.strategies, 1):
            print(f"  [{idx}] {strat.strategy_id} - '{strat.title}'")
            print(f"      Overview: {strat.description}")
            if strat.risk_analysis:
                print(f"      Risk Analysis: {strat.risk_analysis}")
    except Exception as exc:
        print(f"\n[ERROR] Failed to obtain strategies from Nebius: {exc}")
        sys.exit(1)

    # ---------------------------------------------------------------------------
    # 5. Executive briefing demonstrating trade-offs (all values labeled as synthetic)
    # ---------------------------------------------------------------------------
    synthetic_simulation_results = {
        "emergency_sourcing": {
            "estimated_financial_impact": "[SYNTHETIC DEMO] -$1.8M",
            "time_to_recovery_days": "[SYNTHETIC DEMO] 14 days",
            "production_capacity_retained": "[SYNTHETIC DEMO] 92%",
            "operational_risk_score": "[SYNTHETIC DEMO] Medium-High (unvetted vendor audit)",
        },
        "wait_for_recovery": {
            "estimated_financial_impact": "[SYNTHETIC DEMO] -$4.2M (idle line costs)",
            "time_to_recovery_days": "[SYNTHETIC DEMO] 45 days",
            "production_capacity_retained": "[SYNTHETIC DEMO] 30%",
            "operational_risk_score": "[SYNTHETIC DEMO] Critical (breaches SLA)",
        },
        "split_procurement": {
            "estimated_financial_impact": "[SYNTHETIC DEMO] -$2.4M",
            "time_to_recovery_days": "[SYNTHETIC DEMO] 21 days",
            "production_capacity_retained": "[SYNTHETIC DEMO] 85%",
            "operational_risk_score": "[SYNTHETIC DEMO] Low-Medium (diversified supply)",
        },
    }

    print("\n[REPORT] Executive Briefing (Demonstration with labeled synthetic simulation metrics):")
    brief = generate_executive_briefing(example_crisis, synthetic_simulation_results)
    print(brief)



if __name__ == "__main__":
    run_smoke_test()

