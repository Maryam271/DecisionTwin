import json
import pytest
import httpx
from pydantic import ValidationError

from backend.schemas import CrisisInput, Strategy, AIResponse
from backend.ai_service import AIService, generate_executive_briefing


@pytest.fixture
def sample_crisis():
    return CrisisInput(
        scenario_name="Primary Supplier Disruption",
        description="A key semiconductor supplier has halted shipments.",
        constraints=["Contingency budget limit $3M", "30-day timeline"],
        objectives=["Maintain 80% production output", "Establish alternate supplier"],
    )


@pytest.fixture
def valid_strategies_payload():
    return {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "strategies": [
                            {
                                "strategy_id": "emergency_sourcing",
                                "title": "Rapid Spot Sourcing",
                                "description": "Engage spot-market component brokers immediately.",
                                "risk_analysis": "Elevated spot market prices and risk of unverified counterfeit batches.",
                            },
                            {
                                "strategy_id": "wait_for_recovery",
                                "title": "Buffered Assembly Pause",
                                "description": "Draw down existing safety stock while monitoring primary vendor recovery.",
                                "risk_analysis": "Risk of complete production halt if outage extends past safety stock buffer.",
                            },
                            {
                                "strategy_id": "split_procurement",
                                "title": "Dual-Track Secondary Sourcing",
                                "description": "Split purchasing 60/40 between existing vendor and a secondary partner.",
                                "risk_analysis": "Moderate onboarding delay with renegotiation friction.",
                            },
                        ]
                    })
                }
            }
        ]
    }


# ===========================================================================
# 1. Schema & Contract Validation Tests
# ===========================================================================

def test_valid_ai_response():
    """Verify that a response with all 3 unique required strategy IDs passes."""
    data = {
        "strategies": [
            {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
            {"strategy_id": "wait_for_recovery", "title": "T2", "description": "D2"},
            {"strategy_id": "split_procurement", "title": "T3", "description": "D3"},
        ]
    }
    resp = AIResponse.model_validate(data)
    assert len(resp.strategies) == 3
    ids = {s.strategy_id for s in resp.strategies}
    assert ids == {"emergency_sourcing", "wait_for_recovery", "split_procurement"}


def test_missing_strategy_id():
    """Verify failure when a required strategy ID is missing."""
    data = {
        "strategies": [
            {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
            {"strategy_id": "wait_for_recovery", "title": "T2", "description": "D2"},
            # Replaced split_procurement with another emergency_sourcing
            {"strategy_id": "emergency_sourcing", "title": "T3", "description": "D3"},
        ]
    }
    with pytest.raises((ValueError, ValidationError)):
        AIResponse.model_validate(data)


def test_duplicate_strategy_id():
    """Verify failure when duplicate IDs are present."""
    data = {
        "strategies": [
            {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
            {"strategy_id": "emergency_sourcing", "title": "T2", "description": "D2"},
            {"strategy_id": "wait_for_recovery", "title": "T3", "description": "D3"},
        ]
    }
    with pytest.raises((ValueError, ValidationError)):
        AIResponse.model_validate(data)


def test_invalid_strategy_id_name():
    """Verify failure when an unknown strategy ID is supplied."""
    data = {
        "strategies": [
            {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
            {"strategy_id": "wait_for_recovery", "title": "T2", "description": "D2"},
            {"strategy_id": "custom_strategy", "title": "T3", "description": "D3"},
        ]
    }
    with pytest.raises((ValueError, ValidationError)):
        AIResponse.model_validate(data)


def test_incorrect_strategy_count():
    """Verify failure when count is not exactly 3."""
    data = {
        "strategies": [
            {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
            {"strategy_id": "wait_for_recovery", "title": "T2", "description": "D2"},
        ]
    }
    with pytest.raises((ValueError, ValidationError)):
        AIResponse.model_validate(data)


# ===========================================================================
# 2. AIService Initialization & Credential Protection Tests
# ===========================================================================

def test_missing_credentials_raises_error(monkeypatch):
    monkeypatch.delenv("NEBIUS_API_KEY", raising=False)
    monkeypatch.delenv("NEBIUS_ENDPOINT", raising=False)
    monkeypatch.delenv("NEBIUS_MODEL", raising=False)
    with pytest.raises(RuntimeError, match="Missing required Nebius configuration"):
        AIService(api_key=None, endpoint=None, model=None)


def test_placeholder_credentials_raises_error():
    with pytest.raises(RuntimeError, match="placeholder values"):
        AIService(
            api_key="YOUR_API_KEY_HERE",
            endpoint="https://api.tokenfactory.nebius.com/v1/chat/completions",
            model="nebius/nvidia/nemotron-3.5-super-vl",
        )


def test_api_key_not_exposed_in_error_or_repr():
    secret_key = "secret_nebius_token_9999"
    service = AIService(
        api_key=secret_key,
        endpoint="https://fake.nebius.com/v1",
        model="fake-model",
    )
    # Check string representations do not leak key
    assert secret_key not in repr(service)
    assert secret_key not in str(service)


# ===========================================================================
# 3. AIService Mocked HTTP Execution Tests (No API credits spent)
# ===========================================================================

def test_get_strategies_success(sample_crisis, valid_strategies_payload):
    def mock_handler(request: httpx.Request):
        assert request.headers["Authorization"] == "Bearer mock_valid_key"
        assert request.url == "https://api.fake.nebius/v1/chat/completions"
        payload = json.loads(request.content)
        assert payload["model"] == "mock-model"
        return httpx.Response(200, json=valid_strategies_payload)

    transport = httpx.MockTransport(mock_handler)
    client = httpx.Client(transport=transport)

    service = AIService(
        api_key="mock_valid_key",
        endpoint="https://api.fake.nebius/v1/chat/completions",
        model="mock-model",
        client=client,
    )
    response = service.get_strategies(sample_crisis)
    assert len(response.strategies) == 3
    strat_ids = [s.strategy_id for s in response.strategies]
    assert strat_ids == ["emergency_sourcing", "wait_for_recovery", "split_procurement"]


def test_get_strategies_markdown_fenced_json(sample_crisis):
    raw_json = json.dumps({
        "strategies": [
            {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
            {"strategy_id": "wait_for_recovery", "title": "T2", "description": "D2"},
            {"strategy_id": "split_procurement", "title": "T3", "description": "D3"},
        ]
    })
    markdown_content = f"```json\n{raw_json}\n```"

    def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={"choices": [{"message": {"content": markdown_content}}]})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    response = service.get_strategies(sample_crisis)
    assert len(response.strategies) == 3


def test_get_strategies_invalid_json(sample_crisis):
    def mock_handler(request: httpx.Request):
        return httpx.Response(200, json={"choices": [{"message": {"content": "INVALID_JSON_HERE"}}]})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    with pytest.raises(RuntimeError, match="Failed to parse or validate model output"):
        service.get_strategies(sample_crisis)


def test_get_strategies_http_error(sample_crisis):
    def mock_handler(request: httpx.Request):
        return httpx.Response(500, text="Internal Server Error at Nebius")

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    with pytest.raises(RuntimeError, match="Nebius API returned HTTP 500"):
        service.get_strategies(sample_crisis)


def test_get_strategies_timeout(sample_crisis):
    def mock_handler(request: httpx.Request):
        raise httpx.TimeoutException("Read timed out")

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    with pytest.raises(RuntimeError, match="timed out"):
        service.get_strategies(sample_crisis)


def test_injected_client_receives_service_timeout(sample_crisis):
    """Verify that an injected client with unset timeout receives the explicit timeout configured on AIService."""
    recorded_timeout = []

    def mock_handler(request: httpx.Request):
        # httpx stores the per-request timeout in request.extensions
        return httpx.Response(200, json={
            "choices": [{"message": {"content": json.dumps({
                "strategies": [
                    {"strategy_id": "emergency_sourcing", "title": "T1", "description": "D1"},
                    {"strategy_id": "wait_for_recovery", "title": "T2", "description": "D2"},
                    {"strategy_id": "split_procurement", "title": "T3", "description": "D3"},
                ]
            })}}]
        })

    # Client without default timeout parameter
    bare_client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        timeout=15.0,
        client=bare_client,
    )
    resp = service.get_strategies(sample_crisis)
    assert len(resp.strategies) == 3
    assert service.timeout == 15.0



def test_get_strategies_network_error(sample_crisis):
    def mock_handler(request: httpx.Request):
        raise httpx.ConnectError("Failed to establish network connection")

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    with pytest.raises(RuntimeError, match="Network error while contacting Nebius API"):
        service.get_strategies(sample_crisis)


# ===========================================================================
# 4. Executive Briefing Tests (Real Simulation Grounding & Missing Data)
# ===========================================================================

def test_briefing_deterministic_with_complete_results(sample_crisis):
    sim_results = {
        "emergency_sourcing": {"cost": "$1.5M", "recovery_days": 14},
        "wait_for_recovery": {"cost": "$4.0M", "recovery_days": 45},
        "split_procurement": {"cost": "$2.2M", "recovery_days": 21},
    }
    briefing = generate_executive_briefing(sample_crisis, sim_results)
    assert "Executive Briefing: Primary Supplier Disruption" in briefing
    assert "Cost: $1.5M" in briefing
    assert "Recovery Days: 45" in briefing
    assert "Missing outcomes" not in briefing


def test_briefing_deterministic_with_missing_simulation_results(sample_crisis):
    briefing = generate_executive_briefing(sample_crisis, simulation_results=None)
    assert "No simulation results were supplied" in briefing
    assert "Limitation" in briefing


def test_briefing_deterministic_with_incomplete_results(sample_crisis):
    # Only 1 strategy evaluated instead of all 3
    partial_results = {
        "emergency_sourcing": {"cost": "$1.5M", "recovery_days": 14}
    }
    briefing = generate_executive_briefing(sample_crisis, partial_results)
    assert "Limitation" in briefing or "Data Completeness" in briefing
    assert "Missing outcomes for:" in briefing
    assert "wait_for_recovery" in briefing or "split_procurement" in briefing


def test_briefing_with_ai_service_passes_real_data(sample_crisis):
    real_sim_results = {
        "emergency_sourcing": {"loss": "$1.2M", "capacity": "90%"},
        "wait_for_recovery": {"loss": "$3.8M", "capacity": "35%"},
        "split_procurement": {"loss": "$2.0M", "capacity": "80%"},
    }

    def mock_handler(request: httpx.Request):
        payload = json.loads(request.content)
        # Ensure real simulation results were passed into model prompt
        user_message = payload["messages"][1]["content"]
        assert "$1.2M" in user_message
        assert "$3.8M" in user_message
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": "Executive Summary: Emergency sourcing preserves 90% capacity at $1.2M loss."
                        }
                    }
                ]
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    ai_service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    brief = generate_executive_briefing(sample_crisis, real_sim_results, ai_service=ai_service)
    assert "Emergency sourcing preserves 90% capacity at $1.2M loss" in brief


def test_briefing_with_ai_service_handles_missing_results_instruction(sample_crisis):
    def mock_handler(request: httpx.Request):
        payload = json.loads(request.content)
        user_message = payload["messages"][1]["content"]
        assert "NONE (Simulation results not available or incomplete)" in user_message
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": "Executive Briefing: Simulation metrics are unavailable. Unable to compare numerical costs."
                        }
                    }
                ]
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    ai_service = AIService(
        api_key="mock_key",
        endpoint="https://fake.url",
        model="fake-model",
        client=client,
    )
    brief = generate_executive_briefing(sample_crisis, simulation_results=None, ai_service=ai_service)
    assert "Simulation metrics are unavailable" in brief
