from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Clube, Escalacao, Jogador


class JogadorRepository:
    def list_active(self, session: Session) -> list[Jogador]:
        query = select(Jogador).where(Jogador.excluido_em.is_(None))
        return list(session.scalars(query))

    def find_active(self, session: Session, jogador_id: int) -> Jogador | None:
        query = select(Jogador).where(
            Jogador.id == jogador_id,
            Jogador.excluido_em.is_(None),
        )
        return session.scalar(query)

    def club_exists(self, session: Session, clube_id: int) -> bool:
        return session.get(Clube, clube_id) is not None

    def create(self, session: Session, player: Jogador) -> Jogador:
        session.add(player)
        session.commit()
        session.refresh(player)
        return player

    def save(self, session: Session, player: Jogador) -> Jogador:
        session.add(player)
        session.commit()
        session.refresh(player)
        return player

    def remove_from_lineup(self, session: Session, jogador_id: int) -> None:
        lineup = session.scalar(
            select(Escalacao).where(Escalacao.jogador_id == jogador_id)
        )
        if lineup is not None:
            session.delete(lineup)
