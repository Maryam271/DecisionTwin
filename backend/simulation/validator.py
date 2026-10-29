
# DecisionTwin - Input Validation
# Member 2: Simulation Engine

import math

REQUIRED_FIELDS = {
    "supply_chain": [
        "inventory",
        "daily_demand",
        "selling_price",
        "emergency_unit_cost",
        "emergency_quantity",
        "emergency_lead_days",
        "normal_lead_days",
        "budget"
    ],
    "cash_flow": [
        "initial_cash",
        "monthly_income",
        "monthly_expenses"
    ]
}

OPTIONAL_FIELDS = {
    "supply_chain": ["horizon_days"],
    "cash_flow": ["months"]
}

INTEGER_FIELDS = {
    "emergency_lead_days",
    "normal_lead_days",
    "horizon_days",
    "months"
}

POSITIVE_FIELDS = {
    "daily_demand",
    "horizon_days",
    "months"
}


def validate_inputs(crisis_type, data):
    if crisis_type not in REQUIRED_FIELDS:
        raise ValueError(
            f"Unsupported crisis type: {crisis_type}"
        )

    if not isinstance(data, dict):
        raise ValueError("Simulation data must be a dictionary")

    required = REQUIRED_FIELDS[crisis_type]
    optional = OPTIONAL_FIELDS[crisis_type]

    validated = {}

    for field in required:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    for field in required + optional:
        if field not in data:
            continue

        value = data[field]

        if isinstance(value, bool):
            raise ValueError(f"{field} must be numeric")

        try:
            number = float(value)
        except (ValueError, TypeError):
            raise ValueError(f"{field} must be numeric")

        if not math.isfinite(number):
            raise ValueError(f"{field} must be finite")

        if number < 0:
            raise ValueError(f"{field} cannot be negative")

        if field in POSITIVE_FIELDS and number == 0:
            raise ValueError(
                f"{field} must be greater than zero"
            )

        if field in INTEGER_FIELDS:
            if not number.is_integer():
                raise ValueError(
                    f"{field} must be a whole number"
                )
            validated[field] = int(number)
        else:
            validated[field] = number

    return validated
