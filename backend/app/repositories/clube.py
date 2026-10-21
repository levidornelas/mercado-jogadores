from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Clube, Jogador


class ClubeRepository:
    def list_all(self, session: Session) -> list[Clube]:
        return list(session.scalars(select(Clube)))

    def find(self, session: Session, clube_id: int) -> Clube | None:
        return session.get(Clube, clube_id)

    def count(self, session: Session) -> int:
        return session.scalar(select(func.count()).select_from(Clube)) or 0

    def find_by_normalized_name(self, session: Session, name: str) -> Clube | None:
        return session.scalar(select(Clube).where(Clube.nome_normalizado == name))

    def find_by_acronym(self, session: Session, acronym: str) -> Clube | None:
        return session.scalar(select(Clube).where(Clube.sigla == acronym))

    def list_players(self, session: Session, clube_id: int) -> list[Jogador]:
        query = select(Jogador).where(
            Jogador.clube_id == clube_id,
            Jogador.excluido_em.is_(None),
        )
        return list(session.scalars(query))

    def create(self, session: Session, club: Clube) -> Clube:
        session.add(club)
        session.commit()
        session.refresh(club)
        return club
