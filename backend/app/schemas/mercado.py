from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.errors import DomainError
from app.schemas.jogador import validate_integer
from app.utils.datetime import parse_loyalty_until


class CompraCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    club_id: int
    loyalty_until: str

    _club_id = field_validator("club_id", mode="before")(validate_integer)

    @field_validator("club_id")
    @classmethod
    def validate_club_id(cls, value: int) -> int:
        if value < 1:
            raise ValueError("inválido")
        return value

    @field_validator("loyalty_until")
    @classmethod
    def validate_loyalty_until(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("inválido")
        try:
            parse_loyalty_until(value)
        except DomainError as error:
            raise ValueError(error.message) from error
        return value


class TransacaoResponse(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    id: int
    club_id: int
    player_id: int
    player_name: str
    type: str
    value: Decimal
    fee: Decimal
    penalty: Decimal
    profit: Decimal | None
    cash_change: Decimal
    created_at: str


class TransactionSummary(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    total_spent: Decimal
    total_received: Decimal
    total_fees: Decimal
    total_penalties: Decimal
    total_profit: Decimal


class TransactionListResponse(BaseModel):
    data: list[TransacaoResponse]
    summary: TransactionSummary
