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


class Jogador(Base):
    __tablename__ = "jogadores"
    __table_args__ = (
        CheckConstraint("posicao IN ('GOL', 'ZAG', 'LAT', 'MEI', 'ATA')"),
        CheckConstraint("condicao IN ('APTO', 'MAL_CONDICIONADO', 'DOENTE')"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    posicao: Mapped[str] = mapped_column(String(3), nullable=False)
    agilidade: Mapped[int] = mapped_column(Integer, nullable=False)
    idade: Mapped[int] = mapped_column(Integer, nullable=False)
    valor_base: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    condicao: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="APTO"
    )
    clube_id: Mapped[int | None] = mapped_column(ForeignKey("clubes.id"), nullable=True)
    velocidade: Mapped[int] = mapped_column(Integer, nullable=False)
    finalizacao: Mapped[int] = mapped_column(Integer, nullable=False)
    passe: Mapped[int] = mapped_column(Integer, nullable=False)
    drible: Mapped[int] = mapped_column(Integer, nullable=False)
    defesa: Mapped[int] = mapped_column(Integer, nullable=False)
    fisico: Mapped[int] = mapped_column(Integer, nullable=False)
    potencial: Mapped[int] = mapped_column(Integer, nullable=False)
    excluido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
