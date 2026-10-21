import math
import re
from datetime import datetime, timedelta, timezone

from app.core.errors import DomainError

BRASILIA = timezone(timedelta(hours=-3))
LOYALTY_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}-03:00")


def now_brasilia() -> datetime:
    return datetime.now(BRASILIA)


def parse_loyalty_until(value: str) -> datetime:
    if not LOYALTY_PATTERN.fullmatch(value):
        raise DomainError("Fim da fidelidade inválido.", 400)
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M-03:00").replace(tzinfo=BRASILIA)
    except ValueError as error:
        raise DomainError("Fim da fidelidade inválido.", 400) from error


def format_brasilia(value: datetime) -> str:
    return value.astimezone(BRASILIA).strftime("%Y-%m-%dT%H:%M:%S-03:00")


def remaining_days(until: datetime, current: datetime) -> int:
    seconds = (until - current).total_seconds()
    return max(0, math.ceil(seconds / 86400))
