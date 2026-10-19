from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Partida(Base):
    __tablename__ = "partidas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mandante_id: Mapped[int] = mapped_column(ForeignKey("clubes.id"), nullable=False)
    visitante_id: Mapped[int] = mapped_column(ForeignKey("clubes.id"), nullable=False)
    gols_mandante: Mapped[int] = mapped_column(Integer, nullable=False)
    gols_visitante: Mapped[int] = mapped_column(Integer, nullable=False)
    formacao_mandante: Mapped[str] = mapped_column(String(5), nullable=False)
    formacao_visitante: Mapped[str] = mapped_column(String(5), nullable=False)
    jogada_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
