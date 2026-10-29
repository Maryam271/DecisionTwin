
# DecisionTwin - Cash Flow Crisis Simulator
# Member 2: Simulation Engine

def simulate_cash_flow(data):
    """
    Simulate three responses to a cash-flow crisis.
    All monetary values are in USD.
    """

    initial_cash = float(data["initial_cash"])
    monthly_income = float(data["monthly_income"])
    monthly_expenses = float(data["monthly_expenses"])
    months = int(data.get("months", 6))

    if initial_cash < 0 or monthly_income < 0:
        raise ValueError("Cash and income cannot be negative")

    if monthly_expenses < 0 or months <= 0:
        raise ValueError("Invalid expenses or months")

    strategies = {
        "no_action": {
            "income_multiplier": 1.0,
            "expense_multiplier": 1.0
        },
        "cost_reduction": {
            "income_multiplier": 1.0,
            "expense_multiplier": 0.8
        },
        "revenue_growth": {
            "income_multiplier": 1.2,
            "expense_multiplier": 1.0
        }
    }

    results = {}

    for strategy, parameters in strategies.items():

        income = (
            monthly_income *
            parameters["income_multiplier"]
        )

        expenses = (
            monthly_expenses *
            parameters["expense_multiplier"]
        )

        cash = initial_cash
        cash_history = []
        first_negative_month = None

        for month in range(1, months + 1):

            cash += income - expenses
            cash_history.append(round(cash, 2))

            if cash < 0 and first_negative_month is None:
                first_negative_month = month

        net_cash_flow = income - expenses

        results[strategy] = {
            "final_cash_usd": round(cash, 2),
            "monthly_net_cash_flow_usd": round(
                net_cash_flow, 2
            ),
            "cash_history": cash_history,
            "first_negative_month": first_negative_month,
            "cash_shortfall_usd": round(
                max(0, -cash), 2
            ),
            "financial_impact_usd": round(
                cash - initial_cash, 2
            )
        }

    return results
