from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Contrato(Base):
    __tablename__ = "contratos"
    __table_args__ = (
        CheckConstraint("situacao IN ('ATIVO', 'ENCERRADO', 'RESCINDIDO')"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    jogador_id: Mapped[int] = mapped_column(ForeignKey("jogadores.id"), nullable=False)
    clube_id: Mapped[int] = mapped_column(ForeignKey("clubes.id"), nullable=False)
    valor_compra: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    fidelidade_ate: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    situacao: Mapped[str] = mapped_column(String(12), nullable=False)
    iniciado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    encerrado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
