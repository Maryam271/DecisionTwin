# DecisionTwin AI Strategy Engine

This repository houses the **AI Strategy Engine** (Member 1) for the DecisionTwin crisis decision-intelligence platform. It interfaces with NVIDIA Nemotron models via the Nebius Token Factory API to propose three qualitative response strategies and synthesize executive trade-off briefings grounded in quantitative Python simulation results.

---

## 1. Project Architecture & Boundaries

To preserve strict separation of concerns across team members:
* **Member 1 (AI Strategy Engine - This Repo)**:
  * Proposes exactly three structured qualitative response strategies (`emergency_sourcing`, `wait_for_recovery`, `split_procurement`).
  * Explains operational, financial, and timeline risks for each option.
  * Generates executive briefings explaining decision trade-offs grounded strictly in Member 2's Python simulation results.
  * **Boundary**: The AI **never** calculates or invents quantitative simulation outcomes (costs, recovery days, capacity percentages).
* **Member 2 (Simulation Engine)**:
  * Ingests the three proposed strategies and runs mathematical/probabilistic crisis impact simulations.
  * Feeds real numerical simulation outputs into the executive briefing layer.
* **Member 3 (Frontend & API Layer)**:
  * Collects user crisis parameters (`CrisisInput`), visualizes strategy options and simulation charts, and displays the executive briefing.

---

## 2. Repository Layout

```text
DecisionTwin/
├── backend/
│   ├── ai_service.py       # Nebius Nemotron client and executive briefing generator
│   ├── prompts.py          # Strict system and user prompt templates
│   └── schemas.py          # Pydantic v2/v1 models and contract validators
├── docs/
│   └── ai-integration.md   # Detailed cross-team integration specifications
├── scripts/
│   └── test_nemotron.py    # Smoke test script for developer verification
├── src/
│   └── main.py             # Example CLI entry point
├── tests/
│   ├── test_ai_service.py          # Unit tests (schemas, errors, timeouts, credentials)
│   └── test_offline_integration.py # Offline integration tests with mocked transports
├── .env.example            # Environment configuration template (placeholders only)
├── .gitignore              # Multi-layer exclusion of secrets, caches, and logs
├── LICENSE                 # MIT License
├── README.md               # Main project documentation
├── requirements.txt        # Python 3.14 compatible dependencies
└── SECURITY.md             # Security policy and secret handling protocols
```

---

## 3. Quick Start & Setup

### Requirements
* Python 3.10+ (tested with Python 3.14.6)
* Git

### Local Environment Setup
1. Clone the repository and navigate into the project directory:
   ```bash
   cd DecisionTwin
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 4. Environment & Security Configuration

1. Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Nebius credentials in `.env`:
   ```ini
   NEBIUS_API_KEY=your_actual_nebius_api_key_here
   NEBIUS_ENDPOINT=https://api.tokenfactory.nebius.com/v1/chat/completions
   NEBIUS_MODEL=nebius/nvidia/nemotron-3.5-super-vl
   ```
   > **Security Warning**: Never commit `.env` to Git. The `.gitignore` is preconfigured to exclude all `.env*` files. See [`SECURITY.md`](file:///c:/Users/muet/Desktop/DecisionTwin/SECURITY.md) for full security and vulnerability disclosure practices.
   >
   > **Note on Model & Endpoint**: The default endpoint and model identifier are defaults and are **NOT verified** on live accounts without active token permissions.

---

## 5. Testing & Verification

All test suites use offline mocked transports (`httpx.MockTransport`), requiring **zero live network calls** and consuming **zero API credits**:

```bash
# Run all unit and offline integration tests (24 passed)
.\venv\Scripts\python.exe -m pytest tests -v
```

### Running the Live Smoke Test
When valid Nebius credentials are configured in `.env`:
```bash
.\venv\Scripts\python.exe scripts/test_nemotron.py
```
*If credentials are missing or are placeholders, the smoke test aborts safely with `LIVE API: NOT VERIFIED`.*

---

## 6. Team Integration Contracts

### Strategy Generation (`backend.ai_service.AIService.get_strategies`)
* **Input**: `backend.schemas.CrisisInput`
* **Output**: `backend.schemas.AIResponse` containing exactly three strategies:
  * `emergency_sourcing`
  * `wait_for_recovery`
  * `split_procurement`

### Executive Briefing (`backend.ai_service.generate_executive_briefing`)
* **Input**:
  * `crisis`: `CrisisInput`
  * `simulation_results`: Dictionary of computed metrics from Member 2's Python simulation.
* **Output**: String executive summary. Flags limitations if data is missing or incomplete.

---

## 7. License

Distributed under the [MIT License](file:///c:/Users/muet/Desktop/DecisionTwin/LICENSE).


