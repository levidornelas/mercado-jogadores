from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Clube, Escalacao, Jogador


class JogadorRepository:
    def list_active(self, sessao: Session) -> list[Jogador]:
        consulta = select(Jogador).where(Jogador.excluido_em.is_(None))
        return list(sessao.scalars(consulta))

    def find_active(self, sessao: Session, jogador_id: int) -> Jogador | None:
        consulta = select(Jogador).where(
            Jogador.id == jogador_id,
            Jogador.excluido_em.is_(None),
        )
        return sessao.scalar(consulta)

    def club_exists(self, sessao: Session, clube_id: int) -> bool:
        return sessao.get(Clube, clube_id) is not None

    def create(self, sessao: Session, jogador: Jogador) -> Jogador:
        sessao.add(jogador)
        sessao.commit()
        sessao.refresh(jogador)
        return jogador

    def save(self, sessao: Session, jogador: Jogador) -> Jogador:
        sessao.add(jogador)
        sessao.commit()
        sessao.refresh(jogador)
        return jogador

    def remove_from_lineup(self, sessao: Session, jogador_id: int) -> None:
        escalacao = sessao.scalar(
            select(Escalacao).where(Escalacao.jogador_id == jogador_id)
        )
        if escalacao is not None:
            sessao.delete(escalacao)
