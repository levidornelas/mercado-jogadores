from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.errors import DomainError
from app.utils.texto import validate_club_acronym, validate_club_name


class ClubeCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    acronym: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("deve ser texto")
        try:
            return validate_club_name(value)
        except DomainError as error:
            raise ValueError(error.message) from error

    @field_validator("acronym")
    @classmethod
    def validate_acronym(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("deve ser texto")
        try:
            return validate_club_acronym(value)
        except DomainError as error:
            raise ValueError(error.message) from error


class ClubeResponse(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})

    id: int
    name: str
    acronym: str
    cash: Decimal
    squad_value: Decimal
    net_worth: Decimal


class ClubeDetailResponse(ClubeResponse):
    players: list[dict]
