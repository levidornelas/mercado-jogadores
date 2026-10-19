from decimal import ROUND_HALF_UP, Decimal

WEIGHTS_BY_POSITION = {
    "GOL": (10, 0, 20, 0, 40, 30),
    "ZAG": (10, 0, 15, 0, 45, 30),
    "LAT": (25, 0, 20, 15, 25, 15),
    "MEI": (10, 15, 35, 25, 5, 10),
    "ATA": (20, 40, 10, 20, 0, 10),
}
CURRENCY_QUANTUM = Decimal("0.01")


def round_currency(value: Decimal) -> Decimal:
    return value.quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP)


def round_integer(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calculate_overall(
    position: str,
    pace: int,
    shooting: int,
    passing: int,
    dribbling: int,
    defending: int,
    physical: int,
) -> int:
    attributes = (pace, shooting, passing, dribbling, defending, physical)
    weighted_sum = sum(
        attribute * weight
        for attribute, weight in zip(
            attributes, WEIGHTS_BY_POSITION[position], strict=True
        )
    )
    return round_integer(Decimal(weighted_sum) / Decimal("100"))


def calculate_base_value(overall: int, potential: int, age: int) -> Decimal:
    overall_component = Decimal("0")
    overall_component += Decimal(max(min(overall, 60) - 40, 0)) * Decimal("0.50")
    overall_component += Decimal(max(min(overall, 75) - 60, 0)) * Decimal("2.00")
    overall_component += Decimal(max(overall - 75, 0)) * Decimal("6.00")
    if age <= 21:
        overall_component *= Decimal(100 + potential - overall) / Decimal("100")
    return max(round_currency(overall_component), Decimal("1.00"))


def calculate_market_value(
    base_value: Decimal, condition: str, agility: int, age: int
) -> Decimal:
    condition_discount = {
        "APTO": Decimal("0"),
        "MAL_CONDICIONADO": Decimal("15"),
        "DOENTE": Decimal("30"),
    }[condition]
    if condition != "APTO":
        if agility >= 80:
            condition_discount /= Decimal("2")
        elif agility <= 30:
            condition_discount += Decimal("10")
    age_adjustment = (
        Decimal("10") if age <= 21 else Decimal("-10") if age >= 32 else Decimal("0")
    )
    total_percentage = max(age_adjustment - condition_discount, Decimal("-40"))
    market_value = round_currency(
        base_value * (Decimal("100") + total_percentage) / Decimal("100")
    )
    return max(market_value, Decimal("1.00"))
