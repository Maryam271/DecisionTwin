import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
from backend.schemas import CrisisInput
from backend.ai_service import AIService, generate_executive_briefing

# Load environment safely
dotenv_path = PROJECT_ROOT / ".env"
if dotenv_path.is_file():
    load_dotenv(dotenv_path)
else:
    load_dotenv()


def main():
    print("[INFO] Starting DecisionTwin AI Strategy Engine example runner...")

    required_vars = ["NEBIUS_API_KEY", "NEBIUS_ENDPOINT", "NEBIUS_MODEL"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        print(f"[FAIL] Missing required environment variables: {', '.join(missing)}.")
        print("       Please configure your local .env file using .env.example as a template.")
        return

    try:
        service = AIService()
    except RuntimeError as err:
        print(f"[FAIL] Configuration error: {err}")
        return

    sample_crisis = CrisisInput(
        scenario_name="Primary Supplier Disruption",
        description="A key component supplier has declared bankruptcy, halting microprocessor deliveries.",
        constraints=["Contingency budget limit: $3,000,000", "Timeline: 30 days"],
        objectives=["Maintain at least 80% production capacity", "Secure alternative certified supplier"],
    )

    print(f"[INFO] Requesting strategies for scenario: '{sample_crisis.scenario_name}'...")
    try:
        response = service.get_strategies(sample_crisis)
        print(f"[SUCCESS] Received {len(response.strategies)} validated strategies:")
        for idx, strat in enumerate(response.strategies, 1):
            print(f"  {idx}. [{strat.strategy_id}] {strat.title}")
            print(f"     Description: {strat.description}")
            if strat.risk_analysis:
                print(f"     Risk: {strat.risk_analysis}")
    except Exception as exc:
        print(f"[ERROR] Failed to retrieve strategies: {exc}")


if __name__ == "__main__":
    main()