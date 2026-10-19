from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.core.errors import DomainError
from app.utils.texto import validar_nome_jogador

POSICOES = {"GOL", "ZAG", "LAT", "MEI", "ATA"}
CONDICOES = {"APTO", "MAL_CONDICIONADO", "DOENTE"}


def validar_inteiro(valor: Any) -> int:
    if isinstance(valor, bool) or not isinstance(valor, int | float):
        raise ValueError("deve ser um número inteiro")
    if isinstance(valor, float) and not valor.is_integer():
        raise ValueError("deve ser um número inteiro")
    return int(valor)


class ModeloEntrada(BaseModel):
    model_config = ConfigDict(extra="ignore")


class JogadorCriacao(ModeloEntrada):
    name: str
    position: str
    agility: int
    age: int
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int
    potential: int

    _inteiros = field_validator(
        "agility",
        "age",
        "pace",
        "shooting",
        "passing",
        "dribbling",
        "defending",
        "physical",
        "potential",
        mode="before",
    )(validar_inteiro)

    @field_validator("name")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        if not isinstance(valor, str):
            raise ValueError("deve ser texto")
        try:
            return validar_nome_jogador(valor)
        except DomainError as erro:
            raise ValueError(erro.message) from erro

    @field_validator("position")
    @classmethod
    def validar_posicao(cls, valor: str) -> str:
        if valor not in POSICOES:
            raise ValueError("posição inválida")
        return valor

    @model_validator(mode="after")
    def validar_regras_cruzadas(self) -> "JogadorCriacao":
        if not 1 <= self.agility <= 100:
            raise ValueError("agilidade deve estar entre 1 e 100")
        if not 16 <= self.age <= 45:
            raise ValueError("idade deve estar entre 16 e 45")
        if self.age >= 35 and self.agility > 85:
            raise ValueError("agilidade máxima para essa idade é 85")
        atributos = (
            self.pace,
            self.shooting,
            self.passing,
            self.dribbling,
            self.defending,
            self.physical,
        )
        if any(atributo < 1 or atributo > 99 for atributo in atributos):
            raise ValueError("os atributos devem estar entre 1 e 99")
        if sum(atributos) > 480:
            raise ValueError("a soma dos atributos não pode passar de 480")
        if not 1 <= self.potential <= 99 or self.potential < max(atributos):
            raise ValueError("potencial inválido")
        if self.age >= 33 and self.potential != max(atributos):
            raise ValueError("o potencial deve ser igual ao maior atributo")
        return self


class JogadorEdicao(ModeloEntrada):
    name: str
    position: str
    agility: int
    age: int

    _inteiros = field_validator("agility", "age", mode="before")(validar_inteiro)

    @field_validator("name")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        if not isinstance(valor, str):
            raise ValueError("deve ser texto")
        try:
            return validar_nome_jogador(valor)
        except DomainError as erro:
            raise ValueError(erro.message) from erro

    @field_validator("position")
    @classmethod
    def validar_posicao(cls, valor: str) -> str:
        if valor not in POSICOES:
            raise ValueError("posição inválida")
        return valor

    @model_validator(mode="after")
    def validar_limites(self) -> "JogadorEdicao":
        if not 1 <= self.agility <= 100:
            raise ValueError("agilidade deve estar entre 1 e 100")
        if not 16 <= self.age <= 45:
            raise ValueError("idade deve estar entre 16 e 45")
        if self.age >= 35 and self.agility > 85:
            raise ValueError("agilidade máxima para essa idade é 85")
        return self


class CondicaoAtualizacao(ModeloEntrada):
    condition: str

    @field_validator("condition")
    @classmethod
    def validar_condicao(cls, valor: str) -> str:
        if valor not in CONDICOES:
            raise ValueError("condição inválida")
        return valor


class JogadorResposta(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})

    id: int
    name: str
    position: str
    agility: int
    age: int
    condition: str
    base_value: Decimal
    market_value: Decimal
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int
    potential: int
    overall: int
    club_id: int | None


class MetaPaginacao(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int


class ListaJogadoresResposta(BaseModel):
    data: list[JogadorResposta]
    meta: MetaPaginacao
