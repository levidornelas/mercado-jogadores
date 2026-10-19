from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class DueloPartida(Base):
    __tablename__ = "duelos_partida"
    __table_args__ = (
        UniqueConstraint("partida_id", "ordem", name="uq_duelos_partida_ordem"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    partida_id: Mapped[int] = mapped_column(ForeignKey("partidas.id"), nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)
    clube_atacante_id: Mapped[int] = mapped_column(
        ForeignKey("clubes.id"), nullable=False
    )
    atacante_id: Mapped[int] = mapped_column(ForeignKey("jogadores.id"), nullable=False)
    defensor_id: Mapped[int] = mapped_column(ForeignKey("jogadores.id"), nullable=False)
    nome_atacante: Mapped[str] = mapped_column(String(100), nullable=False)
    nome_defensor: Mapped[str] = mapped_column(String(100), nullable=False)
    posicao_atacante: Mapped[str] = mapped_column(String(3), nullable=False)
    posicao_defensor: Mapped[str] = mapped_column(String(3), nullable=False)
    condicao_atacante: Mapped[str] = mapped_column(String(20), nullable=False)
    condicao_defensor: Mapped[str] = mapped_column(String(20), nullable=False)
    atributo_ataque: Mapped[str] = mapped_column(String(10), nullable=False)
    atributo_defesa: Mapped[str] = mapped_column(String(10), nullable=False)
    valor_ataque: Mapped[int] = mapped_column(Integer, nullable=False)
    valor_defesa: Mapped[int] = mapped_column(Integer, nullable=False)
    gol: Mapped[bool] = mapped_column(Boolean, nullable=False)
