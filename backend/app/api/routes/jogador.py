from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import DomainError
from app.schemas.jogador import (
    CondicaoAtualizacao,
    JogadorCriacao,
    JogadorEdicao,
    JogadorResposta,
    ListaJogadoresResposta,
)
from app.services.jogador import JogadorService
from app.utils.texto import is_integer

router = APIRouter(prefix="/players", tags=["jogadores"])
jogador_service = JogadorService()


def get_path_id(valor: str) -> int:
    if not is_integer(valor) or int(valor) > 2_147_483_647:
        raise DomainError("Jogador não encontrado.", 404)
    return int(valor)


@router.get("", response_model=ListaJogadoresResposta)
def listar_jogadores(
    requisicao: Request,
    sessao: Session = Depends(get_session),
) -> ListaJogadoresResposta:
    return jogador_service.list(sessao, dict(requisicao.query_params))


@router.post("", response_model=JogadorResposta, status_code=status.HTTP_201_CREATED)
def criar_jogador(
    dados: JogadorCriacao,
    resposta: Response,
    sessao: Session = Depends(get_session),
) -> JogadorResposta:
    jogador = jogador_service.create(sessao, dados)
    resposta.headers["Location"] = f"/api/v1/players/{jogador.id}"
    return jogador


@router.patch("/{jogador_id}/condition", response_model=JogadorResposta)
def atualizar_condicao(
    jogador_id: str,
    dados: CondicaoAtualizacao,
    sessao: Session = Depends(get_session),
) -> JogadorResposta:
    return jogador_service.update_condition(sessao, get_path_id(jogador_id), dados)


@router.put("/{jogador_id}", response_model=JogadorResposta)
def editar_jogador(
    jogador_id: str,
    dados: JogadorEdicao,
    sessao: Session = Depends(get_session),
) -> JogadorResposta:
    return jogador_service.update(sessao, get_path_id(jogador_id), dados)


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_jogador(
    jogador_id: str,
    sessao: Session = Depends(get_session),
) -> Response:
    jogador_service.delete(sessao, get_path_id(jogador_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{jogador_id}", response_model=JogadorResposta)
def buscar_jogador(
    jogador_id: str,
    sessao: Session = Depends(get_session),
) -> JogadorResposta:
    return jogador_service.find(sessao, get_path_id(jogador_id))
