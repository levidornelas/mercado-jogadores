from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Clube, DueloPartida, Escalacao, Jogador, Partida


class LigaRepository:
    def club(self, session: Session, club_id: int) -> Clube | None:
        return session.get(Clube, club_id)

    def clubs(self, session: Session) -> list[Clube]:
        return list(session.scalars(select(Clube)))

    def players(self, session: Session, ids: list[int]) -> list[Jogador]:
        return list(
            session.scalars(
                select(Jogador).where(
                    Jogador.id.in_(ids), Jogador.excluido_em.is_(None)
                )
            )
        )

    def lineup(self, session: Session, club_id: int) -> list[Jogador]:
        query = (
            select(Jogador)
            .join(Escalacao, Escalacao.jogador_id == Jogador.id)
            .where(Escalacao.clube_id == club_id, Jogador.excluido_em.is_(None))
        )
        return list(session.scalars(query))

    def delete_lineup(self, session: Session, club_id: int) -> None:
        for item in list(
            session.scalars(select(Escalacao).where(Escalacao.clube_id == club_id))
        ):
            session.delete(item)

    def matches(self, session: Session, club_id: int | None = None) -> list[Partida]:
        query = select(Partida)
        if club_id is not None:
            query = query.where(
                or_(Partida.mandante_id == club_id, Partida.visitante_id == club_id)
            )
        return list(
            session.scalars(query.order_by(Partida.jogada_em.desc(), Partida.id.desc()))
        )

    def match(self, session: Session, match_id: int) -> Partida | None:
        return session.get(Partida, match_id)

    def duels(self, session: Session, match_id: int) -> list[DueloPartida]:
        return list(
            session.scalars(
                select(DueloPartida)
                .where(DueloPartida.partida_id == match_id)
                .order_by(DueloPartida.ordem)
            )
        )
