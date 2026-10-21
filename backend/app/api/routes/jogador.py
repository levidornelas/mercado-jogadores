from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import DomainError
from app.schemas.jogador import (
    CondicaoUpdate,
    JogadorCreate,
    JogadorListResponse,
    JogadorResponse,
    JogadorUpdate,
)
from app.schemas.mercado import CompraCreate
from app.services.jogador import JogadorService
from app.services.mercado import MercadoService
from app.utils.texto import is_positive_integer

router = APIRouter(prefix="/players", tags=["jogadores"])
jogador_service = JogadorService()
mercado_service = MercadoService()


def get_path_id(value: str) -> int:
    if not is_positive_integer(value) or int(value) > 2_147_483_647:
        raise DomainError("Jogador não encontrado.", 404)
    return int(value)


@router.get("", response_model=JogadorListResponse)
def list_players(
    request: Request,
    session: Session = Depends(get_session),
) -> JogadorListResponse:
    return jogador_service.list(session, dict(request.query_params))


@router.post("", response_model=JogadorResponse, status_code=status.HTTP_201_CREATED)
def create_player(
    data: JogadorCreate,
    response: Response,
    session: Session = Depends(get_session),
) -> JogadorResponse:
    player = jogador_service.create(session, data)
    response.headers["Location"] = f"/api/v1/players/{player.id}"
    return player


@router.patch("/{jogador_id}/condition", response_model=JogadorResponse)
def update_condition(
    jogador_id: str,
    data: CondicaoUpdate,
    session: Session = Depends(get_session),
) -> JogadorResponse:
    return jogador_service.update_condition(session, get_path_id(jogador_id), data)


@router.put("/{jogador_id}", response_model=JogadorResponse)
def update_player(
    jogador_id: str,
    data: JogadorUpdate,
    session: Session = Depends(get_session),
) -> JogadorResponse:
    return jogador_service.update(session, get_path_id(jogador_id), data)


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    jogador_id: str,
    session: Session = Depends(get_session),
) -> Response:
    jogador_service.delete(session, get_path_id(jogador_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{jogador_id}", response_model=JogadorResponse)
def find_player(
    jogador_id: str,
    session: Session = Depends(get_session),
) -> JogadorResponse:
    return jogador_service.find(session, get_path_id(jogador_id))


@router.post("/{jogador_id}/buy")
def buy_player(
    jogador_id: str, data: CompraCreate, session: Session = Depends(get_session)
) -> dict:
    return mercado_service.buy(session, get_path_id(jogador_id), data)


@router.post("/{jogador_id}/sell")
def sell_player(jogador_id: str, session: Session = Depends(get_session)) -> dict:
    return mercado_service.sell(session, get_path_id(jogador_id))
