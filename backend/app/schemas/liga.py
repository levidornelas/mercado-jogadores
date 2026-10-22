from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.schemas.jogador import validate_integer

FORMATIONS = {
    "3-1": (3, 0, 1),
    "2-2": (2, 0, 2),
    "2-1-1": (2, 1, 1),
    "1-2-1": (1, 2, 1),
}


class LineupUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    formation: str
    player_ids: list[int]

    @field_validator("player_ids", mode="before")
    @classmethod
    def validate_player_ids(cls, value: Any) -> list[int]:
        if not isinstance(value, list):
            raise ValueError("deve ser uma lista")
        try:
            return [validate_integer(item) for item in value]
        except ValueError as error:
            raise ValueError("ids inválidos") from error

    @model_validator(mode="after")
    def validate_content(self) -> "LineupUpdate":
        if self.formation not in FORMATIONS:
            raise ValueError("formação inválida")
        if (
            len(self.player_ids) != 5
            or len(set(self.player_ids)) != 5
            or any(item < 1 for item in self.player_ids)
        ):
            raise ValueError("ids inválidos")
        return self


class MatchCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    home_club_id: int
    away_club_id: int

    _ids = field_validator("home_club_id", "away_club_id", mode="before")(
        validate_integer
    )

    @model_validator(mode="after")
    def validate_ids(self) -> "MatchCreate":
        if (
            self.home_club_id < 1
            or self.away_club_id < 1
            or self.home_club_id == self.away_club_id
        ):
            raise ValueError("clubes inválidos")
        return self
