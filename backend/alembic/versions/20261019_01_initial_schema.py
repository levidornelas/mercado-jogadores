"""create initial league schema

Revision ID: 20261019_01
Revises:
Create Date: 2026-10-19 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20261019_01"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "clubes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=60), nullable=False),
        sa.Column("nome_normalizado", sa.String(length=60), nullable=False),
        sa.Column("sigla", sa.String(length=3), nullable=False),
        sa.Column(
            "caixa",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="300.00",
        ),
        sa.Column("formacao", sa.String(length=5), nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "formacao IS NULL OR formacao IN ('3-1', '2-2', '2-1-1', '1-2-1')"
        ),
        sa.UniqueConstraint("nome_normalizado", name="uq_clubes_nome_normalizado"),
        sa.UniqueConstraint("sigla", name="uq_clubes_sigla"),
    )
    op.create_table(
        "jogadores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("posicao", sa.String(length=3), nullable=False),
        sa.Column("agilidade", sa.Integer(), nullable=False),
        sa.Column("idade", sa.Integer(), nullable=False),
        sa.Column("valor_base", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column(
            "condicao", sa.String(length=20), nullable=False, server_default="APTO"
        ),
        sa.Column("clube_id", sa.Integer(), sa.ForeignKey("clubes.id"), nullable=True),
        sa.Column("velocidade", sa.Integer(), nullable=False),
        sa.Column("finalizacao", sa.Integer(), nullable=False),
        sa.Column("passe", sa.Integer(), nullable=False),
        sa.Column("drible", sa.Integer(), nullable=False),
        sa.Column("defesa", sa.Integer(), nullable=False),
        sa.Column("fisico", sa.Integer(), nullable=False),
        sa.Column("potencial", sa.Integer(), nullable=False),
        sa.Column("excluido_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("posicao IN ('GOL', 'ZAG', 'LAT', 'MEI', 'ATA')"),
        sa.CheckConstraint("condicao IN ('APTO', 'MAL_CONDICIONADO', 'DOENTE')"),
    )
    op.create_table(
        "contratos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "jogador_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=False
        ),
        sa.Column("clube_id", sa.Integer(), sa.ForeignKey("clubes.id"), nullable=False),
        sa.Column("valor_compra", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("fidelidade_ate", sa.DateTime(timezone=True), nullable=False),
        sa.Column("situacao", sa.String(length=12), nullable=False),
        sa.Column(
            "iniciado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("encerrado_em", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("situacao IN ('ATIVO', 'ENCERRADO', 'RESCINDIDO')"),
    )
    op.create_table(
        "transacoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("clube_id", sa.Integer(), sa.ForeignKey("clubes.id"), nullable=False),
        sa.Column(
            "jogador_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=False
        ),
        sa.Column("nome_jogador", sa.String(length=100), nullable=False),
        sa.Column("tipo", sa.String(length=6), nullable=False),
        sa.Column("valor", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("taxa", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("multa", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("lucro", sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column("variacao_caixa", sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("tipo IN ('COMPRA', 'VENDA')"),
    )
    op.create_table(
        "escalacoes",
        sa.Column(
            "clube_id", sa.Integer(), sa.ForeignKey("clubes.id"), primary_key=True
        ),
        sa.Column(
            "jogador_id", sa.Integer(), sa.ForeignKey("jogadores.id"), primary_key=True
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("jogador_id"),
    )
    op.create_table(
        "partidas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "mandante_id", sa.Integer(), sa.ForeignKey("clubes.id"), nullable=False
        ),
        sa.Column(
            "visitante_id", sa.Integer(), sa.ForeignKey("clubes.id"), nullable=False
        ),
        sa.Column("gols_mandante", sa.Integer(), nullable=False),
        sa.Column("gols_visitante", sa.Integer(), nullable=False),
        sa.Column("formacao_mandante", sa.String(length=5), nullable=False),
        sa.Column("formacao_visitante", sa.String(length=5), nullable=False),
        sa.Column(
            "jogada_em",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_table(
        "duelos_partida",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "partida_id", sa.Integer(), sa.ForeignKey("partidas.id"), nullable=False
        ),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.Column(
            "clube_atacante_id",
            sa.Integer(),
            sa.ForeignKey("clubes.id"),
            nullable=False,
        ),
        sa.Column(
            "atacante_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=False
        ),
        sa.Column(
            "defensor_id", sa.Integer(), sa.ForeignKey("jogadores.id"), nullable=False
        ),
        sa.Column("nome_atacante", sa.String(length=100), nullable=False),
        sa.Column("nome_defensor", sa.String(length=100), nullable=False),
        sa.Column("posicao_atacante", sa.String(length=3), nullable=False),
        sa.Column("posicao_defensor", sa.String(length=3), nullable=False),
        sa.Column("condicao_atacante", sa.String(length=20), nullable=False),
        sa.Column("condicao_defensor", sa.String(length=20), nullable=False),
        sa.Column("atributo_ataque", sa.String(length=10), nullable=False),
        sa.Column("atributo_defesa", sa.String(length=10), nullable=False),
        sa.Column("valor_ataque", sa.Integer(), nullable=False),
        sa.Column("valor_defesa", sa.Integer(), nullable=False),
        sa.Column("gol", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("partida_id", "ordem", name="uq_duelos_partida_ordem"),
    )


def downgrade() -> None:
    op.drop_table("duelos_partida")
    op.drop_table("partidas")
    op.drop_table("escalacoes")
    op.drop_table("transacoes")
    op.drop_table("contratos")
    op.drop_table("jogadores")
    op.drop_table("clubes")
