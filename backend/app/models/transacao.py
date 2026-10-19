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


class Transacao(Base):
    __tablename__ = "transacoes"
    __table_args__ = (CheckConstraint("tipo IN ('COMPRA', 'VENDA')"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clube_id: Mapped[int] = mapped_column(ForeignKey("clubes.id"), nullable=False)
    jogador_id: Mapped[int] = mapped_column(ForeignKey("jogadores.id"), nullable=False)
    nome_jogador: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo: Mapped[str] = mapped_column(String(6), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    taxa: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    multa: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    lucro: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))
    variacao_caixa: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
