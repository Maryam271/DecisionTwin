import json
import os
import re
from typing import Dict, Any, Optional

import httpx
from pydantic import ValidationError

from .schemas import CrisisInput, AIResponse
from .prompts import (
    system_prompt,
    user_prompt,
    executive_briefing_system_prompt,
    executive_briefing_user_prompt,
)


def _clean_json_content(content: str) -> str:
    """Strip markdown code fences and whitespace from model response."""
    text = content.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return text


class AIService:
    """Client for Nebius Token Factory Nemotron model.

    - Validates configuration on init without printing API keys.
    - Handles connection errors, timeouts, and HTTP errors gracefully.
    - Parses JSON output (including markdown-fenced blocks) and validates it against ``AIResponse``.
    - Keeps AI responsible for proposing strategies and risks—not calculating simulation outcomes.
    - Never logs or prints the API key.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 30.0,
        client: Optional[httpx.Client] = None,
    ):
        # Load from environment if not supplied
        self.api_key = api_key or os.getenv("NEBIUS_API_KEY")
        self.endpoint = endpoint or os.getenv("NEBIUS_ENDPOINT")
        self.model = model or os.getenv("NEBIUS_MODEL")

        if not self.api_key or not self.endpoint or not self.model:
            raise RuntimeError(
                "Missing required Nebius configuration (API key, endpoint, or model). "
                "Ensure .env is loaded before creating AIService."
            )

        # Detect obvious placeholder values
        placeholders = {"YOUR_API_KEY_HERE", "NEBIUS_ENDPOINT", "NEBIUS_MODEL"}
        for val in (self.api_key, self.endpoint, self.model):
            if val.strip().upper() in placeholders or "your_" in val.lower():
                raise RuntimeError(
                    "Nebius configuration contains placeholder values. "
                    "Please set real credentials in .env before initializing AIService."
                )

        self.timeout = timeout
        self.client = client or httpx.Client(timeout=timeout)

    def _build_payload(self, crisis: CrisisInput) -> Dict[str, Any]:
        crisis_data = crisis.model_dump() if hasattr(crisis, "model_dump") else crisis.dict()
        user_msg = user_prompt.format(crisis=json.dumps(crisis_data, ensure_ascii=False, indent=2))
        return {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            "max_tokens": 1500,
        }

    def get_strategies(self, crisis: CrisisInput) -> AIResponse:
        """Call Nebius Nemotron model to generate 3 crisis response strategies."""
        payload = self._build_payload(crisis)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            response = self.client.post(self.endpoint, json=payload, headers=headers, timeout=self.timeout)
        except httpx.TimeoutException as exc:
            raise RuntimeError(f"Request to Nebius API timed out after {self.timeout}s: {exc}")
        except httpx.RequestError as exc:
            raise RuntimeError(f"Network error while contacting Nebius API: {exc}")

        if response.status_code != 200:
            raise RuntimeError(
                f"Nebius API returned HTTP {response.status_code}: {response.text}"
            )

        try:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not content:
                raise ValueError("Nebius API returned empty content in response choices.")
            clean_content = _clean_json_content(content)
            parsed = json.loads(clean_content)
            if hasattr(AIResponse, "model_validate"):
                return AIResponse.model_validate(parsed)
            return AIResponse.parse_obj(parsed)
        except (json.JSONDecodeError, ValidationError, ValueError) as exc:
            raise RuntimeError(f"Failed to parse or validate model output: {exc}")
        except Exception as exc:
            raise RuntimeError(f"Unexpected error processing Nebius response: {exc}")

    def generate_ai_briefing(
        self, crisis: CrisisInput, simulation_results: Optional[Dict[str, Any]]
    ) -> str:
        """Generate an executive briefing via Nemotron using real simulation results.

        Explicitly instructs the model never to hallucinate metrics and highlights
        limitations if simulation data is incomplete or missing.
        """
        results_str = (
            json.dumps(simulation_results, indent=2, ensure_ascii=False)
            if simulation_results
            else "NONE (Simulation results not available or incomplete)"
        )

        crisis_data = crisis.model_dump() if hasattr(crisis, "model_dump") else crisis.dict()
        user_msg = executive_briefing_user_prompt.format(
            crisis=json.dumps(crisis_data, indent=2, ensure_ascii=False),
            simulation_results=results_str,
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": executive_briefing_system_prompt},
                {"role": "user", "content": user_msg},
            ],
            "max_tokens": 1000,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            response = self.client.post(self.endpoint, json=payload, headers=headers, timeout=self.timeout)

        except httpx.TimeoutException as exc:
            raise RuntimeError(f"Request to Nebius API timed out after {self.timeout}s: {exc}")
        except httpx.RequestError as exc:
            raise RuntimeError(f"Network error while contacting Nebius API: {exc}")

        if response.status_code != 200:
            raise RuntimeError(
                f"Nebius API returned HTTP {response.status_code}: {response.text}"
            )

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return content.strip()


def generate_executive_briefing(
    crisis: CrisisInput,
    simulation_results: Optional[Dict[str, Any]] = None,
    ai_service: Optional[AIService] = None,
) -> str:
    """Create an executive briefing explaining trade-offs using real simulation results.

    - If an ``ai_service`` is provided, uses Nemotron to generate the briefing while
      passing strictly the supplied simulation results and prohibiting invented metrics.
    - If no ``ai_service`` is supplied, returns a formatted plain-text briefing.
    - If simulation results are missing or incomplete, explicitly notes that limitation.
    - Never fabricates or presents sample numbers as real results.
    """
    if ai_service is not None:
        return ai_service.generate_ai_briefing(crisis, simulation_results)

    # Deterministic plain-text fallback briefing
    lines = [
        f"Executive Briefing: {crisis.scenario_name}",
        "=" * (20 + len(crisis.scenario_name)),
        f"Crisis Summary: {crisis.description}",
    ]

    if crisis.constraints:
        lines.append(f"Constraints: {'; '.join(crisis.constraints)}")
    if crisis.objectives:
        lines.append(f"Objectives: {'; '.join(crisis.objectives)}")

    lines.append("\nSimulation Trade-off Analysis:")

    if not simulation_results:
        lines.append(
            "⚠️ Limitation: No simulation results were supplied. "
            "Quantitative metrics and trade-off comparisons are currently unavailable."
        )
        return "\n".join(lines)

    # Check for incomplete data
    expected_strategies = {"emergency_sourcing", "wait_for_recovery", "split_procurement"}
    provided_keys = set(simulation_results.keys())

    # Format provided simulation data
    for key, value in simulation_results.items():
        title = key.replace("_", " ").title()
        if isinstance(value, dict):
            lines.append(f"\n[{title}]")
            for sub_k, sub_v in value.items():
                lines.append(f"  • {sub_k.replace('_', ' ').title()}: {sub_v}")
        else:
            lines.append(f"  • {title}: {value}")

    # Check if any strategy metrics are missing when strategies are evaluated
    if provided_keys.intersection(expected_strategies) and not expected_strategies.issubset(provided_keys):
        missing_strats = expected_strategies - provided_keys
        lines.append(
            f"\n⚠️ Note on Data Completeness: Simulation results are incomplete. "
            f"Missing outcomes for: {', '.join(missing_strats)}."
        )

    return "\n".join(lines)

