from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Clube(Base):
    __tablename__ = "clubes"
    __table_args__ = (
        UniqueConstraint("nome_normalizado", name="uq_clubes_nome_normalizado"),
        UniqueConstraint("sigla", name="uq_clubes_sigla"),
        CheckConstraint(
            "formacao IS NULL OR formacao IN ('3-1', '2-2', '2-1-1', '1-2-1')"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(60), nullable=False)
    nome_normalizado: Mapped[str] = mapped_column(String(60), nullable=False)
    sigla: Mapped[str] = mapped_column(String(3), nullable=False)
    caixa: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, server_default="300.00"
    )
    formacao: Mapped[str | None] = mapped_column(String(5), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
