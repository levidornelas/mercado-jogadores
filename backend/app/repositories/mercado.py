from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Clube, Contrato, Escalacao, Jogador, Transacao


class MercadoRepository:
    def player(self, session: Session, player_id: int) -> Jogador | None:
        return session.scalar(
            select(Jogador).where(
                Jogador.id == player_id, Jogador.excluido_em.is_(None)
            )
        )

    def club(self, session: Session, club_id: int) -> Clube | None:
        return session.get(Clube, club_id)

    def squad_size(self, session: Session, club_id: int) -> int:
        return len(
            list(
                session.scalars(
                    select(Jogador.id).where(
                        Jogador.clube_id == club_id, Jogador.excluido_em.is_(None)
                    )
                )
            )
        )

    def was_sold_by(self, session: Session, club_id: int, player_id: int) -> bool:
        return (
            session.scalar(
                select(Transacao.id).where(
                    Transacao.clube_id == club_id,
                    Transacao.jogador_id == player_id,
                    Transacao.tipo == "VENDA",
                )
            )
            is not None
        )

    def active_contract(self, session: Session, player_id: int) -> Contrato | None:
        return session.scalar(
            select(Contrato).where(
                Contrato.jogador_id == player_id, Contrato.situacao == "ATIVO"
            )
        )

    def transactions(
        self,
        session: Session,
        club_id: int,
        types: set[str] | None,
        player_id: int | None,
    ) -> list[Transacao]:
        query = select(Transacao).where(Transacao.clube_id == club_id)
        if types:
            query = query.where(Transacao.tipo.in_(types))
        if player_id:
            query = query.where(Transacao.jogador_id == player_id)
        return list(
            session.scalars(
                query.order_by(Transacao.criado_em.desc(), Transacao.id.desc())
            )
        )

    def remove_lineup(self, session: Session, player_id: int) -> None:
        lineup = session.scalar(
            select(Escalacao).where(Escalacao.jogador_id == player_id)
        )
        if lineup:
            session.delete(lineup)
