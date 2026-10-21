from decimal import Decimal

from app.services.calculos_jogador import round_currency


def calculate_purchase_fee(value: Decimal) -> Decimal:
    return round_currency(value * Decimal("0.05")) if value > 30 else Decimal("0.00")


def penalty_rate(days: int) -> int:
    if days == 0:
        return 0
    if days <= 30:
        return 5
    if days <= 180:
        return 10
    return 20


def calculate_penalty(value: Decimal, days: int) -> tuple[int, Decimal]:
    rate = penalty_rate(days)
    return rate, min(Decimal("10.00"), round_currency(value * Decimal(rate) / 100))


def calculate_commission(profit: Decimal) -> Decimal:
    if profit <= 0:
        return Decimal("0.00")
    return round_currency(
        min(profit, Decimal("10")) * Decimal("0.10")
        + max(profit - 10, 0) * Decimal("0.20")
    )
