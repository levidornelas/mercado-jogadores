from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import DomainError
from app.schemas.clube import ClubeCreate, ClubeDetailResponse, ClubeResponse
from app.services.clube import ClubeService
from app.utils.texto import is_positive_integer

router = APIRouter(prefix="/clubs", tags=["clubes"])
clube_service = ClubeService()


def get_club_id(value: str) -> int:
    if not is_positive_integer(value) or int(value) > 2_147_483_647:
        raise DomainError("Clube não encontrado.", 404)
    return int(value)


@router.get("", response_model=list[ClubeResponse])
def list_clubs(
    request: Request, session: Session = Depends(get_session)
) -> list[ClubeResponse]:
    return clube_service.list(session, request.query_params.get("sort", "name"))


@router.post("", response_model=ClubeResponse, status_code=status.HTTP_201_CREATED)
def create_club(
    data: ClubeCreate,
    response: Response,
    session: Session = Depends(get_session),
) -> ClubeResponse:
    club = clube_service.create(session, data)
    response.headers["Location"] = f"/api/v1/clubs/{club.id}"
    return club


@router.get("/{clube_id}", response_model=ClubeDetailResponse)
def find_club(
    clube_id: str, session: Session = Depends(get_session)
) -> ClubeDetailResponse:
    return clube_service.find(session, get_club_id(clube_id))
