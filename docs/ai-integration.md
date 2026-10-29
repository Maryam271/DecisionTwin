# DecisionTwin AI Integration Specification (Member 1)

This document specifies the contract, boundaries, and implementation details for the **AI Strategy Engine** in DecisionTwin, integrating NVIDIA Nemotron models via Nebius Token Factory.

---

## 1. System Responsibilities and Boundaries

To maintain a clean separation of concerns among team members:
- **AI Strategy Engine (Member 1)**:
  - Consumes structured crisis definitions (`CrisisInput`).
  - Calls the Nebius Nemotron model to propose three distinct qualitative response strategies (`AIResponse`).
  - Provides qualitative risk analysis (operational, financial, timing) for each strategy.
  - Generates executive briefings explaining trade-offs grounded **strictly** in the quantitative outcomes supplied by the Python simulation.
  - **Boundaries**: The AI **never** calculates or invents quantitative simulation results (e.g., loss figures, recovery day counts, capacity curves). Those are calculated independently by the Python simulation engine (Member 2).
- **Simulation Engine (Member 2)**:
  - Takes the proposed strategies and executes mathematical/probabilistic scenario models.
  - Supplies verified numerical simulation results back to the executive briefing layer.
- **Frontend / UI (Member 3)**:
  - Renders the dashboard, scenario inputs, strategy cards, simulation charts, and executive briefing.

---

## 2. AI Strategy Contract Schema

The AI response must strictly conform to the Pydantic schema defined in [`backend/schemas.py`](file:///c:/Users/muet/Desktop/DecisionTwin/backend/schemas.py).

### Exact Strategy IDs
The model response must contain **exactly three unique strategies** matching the enum:
1. `emergency_sourcing`
2. `wait_for_recovery`
3. `split_procurement`

### Strategy Object Schema
Each strategy object contains:
- `strategy_id`: `Literal["emergency_sourcing", "wait_for_recovery", "split_procurement"]`
- `title`: Short descriptive title (string).
- `description`: Detailed explanation of the approach (string).
- `risk_analysis`: Qualitative breakdown of operational, financial, and timeline risks (string, optional/recommended).

### Validation
The top-level `AIResponse` enforces:
- Exactly 3 items in `strategies`.
- Complete set of the three expected strategy IDs.
- Zero duplicate IDs.
- Rejection of unknown strategy IDs.

---

## 3. Executive Briefing & Simulation Grounding

The executive briefing function [`generate_executive_briefing`](file:///c:/Users/muet/Desktop/DecisionTwin/backend/ai_service.py) synthesizes decision trade-offs:
- **Strict Grounding**: Uses only real quantitative values supplied in `simulation_results`.
- **Hallucination Prevention**: Prompts specifically instruct the LLM never to extrapolate or fabricate missing numbers or outcomes.
- **Explicit Limitations**: If simulation results are empty, missing, or incomplete (e.g., missing metrics for one or more strategies), the briefing explicitly flags that limitation to the decision-maker.
- **Demonstration Data**: Any mock or demonstration figures used during testing must be explicitly labeled as `[SYNTHETIC DEMO]` to prevent misinterpretation.

---

## 4. Configuration and Environment Variables

Configuration is loaded from `.env` at the project root using `python-dotenv`:

| Variable | Description | Default / Example | Status |
| :--- | :--- | :--- | :--- |
| `NEBIUS_API_KEY` | Bearer token for Nebius Token Factory | `YOUR_NEBIUS_API_KEY_HERE` | Secret. Must be provided by user. |
| `NEBIUS_ENDPOINT` | OpenAI-compatible chat completion endpoint | `https://api.tokenfactory.nebius.com/v1/chat/completions` | **Unverified default**. Must verify against account permissions. |
| `NEBIUS_MODEL` | Model ID identifier on Nebius | `nebius/nvidia/nemotron-3.5-super-vl` | **Unverified default**. Must verify against available account models. |

### Credential Protection Rules
- The API key is **never** logged, printed to console, or included in error traces.
- `AIService` and `scripts/test_nemotron.py` detect empty strings or placeholder text (`YOUR_API_KEY...`, `EXAMPLE`) and exit before making network requests.

---

## 5. Testing and Verification

- **Mocked Unit Tests**: Located in [`tests/test_ai_service.py`](file:///c:/Users/muet/Desktop/DecisionTwin/tests/test_ai_service.py).
  - Uses `httpx.MockTransport` to isolate network calls.
  - Zero API credits consumed during tests.
  - Validates:
    - Successful parsing of compliant responses and markdown-fenced JSON.
    - Missing, duplicate, or unknown strategy IDs.
    - Invalid JSON payloads.
    - HTTP 500 errors, timeouts, and connection failures.
    - Missing and placeholder credentials handling.
    - Executive briefing generation with complete, partial, and absent simulation results.
- **Running Tests**:
  ```bash
  .\venv\Scripts\python.exe -m pytest tests -v
  ```
- **Live Smoke Test**: Run [`scripts/test_nemotron.py`](file:///c:/Users/muet/Desktop/DecisionTwin/scripts/test_nemotron.py).
  - Automatically verifies `.env` presence.
  - Reports `LIVE API: NOT VERIFIED` safely if valid credentials are not configured.
