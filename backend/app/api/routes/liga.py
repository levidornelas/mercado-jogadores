from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.routes.clube import get_club_id
from app.core.database import get_session
from app.core.errors import DomainError
from app.schemas.liga import LineupUpdate, MatchCreate
from app.services.liga import LigaService
from app.utils.texto import is_positive_integer

router = APIRouter(tags=["liga"])
liga_service = LigaService()


def get_match_id(value: str) -> int:
    if not is_positive_integer(value) or int(value) > 2_147_483_647:
        raise DomainError("Partida não encontrada.", 404)
    return int(value)


@router.put("/clubs/{clube_id}/lineup")
def save_lineup(
    clube_id: str, data: LineupUpdate, session: Session = Depends(get_session)
) -> dict:
    return liga_service.save_lineup(session, get_club_id(clube_id), data)


@router.get("/clubs/{clube_id}/lineup")
def get_lineup(clube_id: str, session: Session = Depends(get_session)) -> dict:
    return liga_service.get_lineup(session, get_club_id(clube_id))


@router.post("/matches", status_code=status.HTTP_201_CREATED)
def play_match(
    data: MatchCreate, response: Response, session: Session = Depends(get_session)
) -> dict:
    match = liga_service.play(session, data)
    response.headers["Location"] = f"/api/v1/matches/{match['id']}"
    return match


@router.get("/matches")
def list_matches(
    request: Request, session: Session = Depends(get_session)
) -> list[dict]:
    return liga_service.list_matches(session, dict(request.query_params))


@router.get("/matches/{partida_id}")
def find_match(partida_id: str, session: Session = Depends(get_session)) -> dict:
    return liga_service.find_match(session, get_match_id(partida_id))


@router.get("/standings")
def standings(session: Session = Depends(get_session)) -> list[dict]:
    return liga_service.standings(session)
