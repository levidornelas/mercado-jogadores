from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.errors import DomainError
from app.schemas.clube import ClubeCreate, ClubeDetailResponse, ClubeResponse
from app.schemas.mercado import TransactionListResponse
from app.services.clube import ClubeService
from app.services.mercado import MercadoService
from app.utils.texto import is_positive_integer

router = APIRouter(prefix="/clubs", tags=["clubes"])
clube_service = ClubeService()
mercado_service = MercadoService()


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


@router.get("/{clube_id}/transactions", response_model=TransactionListResponse)
def list_transactions(
    clube_id: str, request: Request, session: Session = Depends(get_session)
) -> TransactionListResponse:
    return mercado_service.list_transactions(
        session, get_club_id(clube_id), dict(request.query_params)
    )


@router.get("/{clube_id}/transactions/export")
def export_transactions(
    clube_id: str, request: Request, session: Session = Depends(get_session)
) -> Response:
    result = mercado_service.list_transactions(
        session, get_club_id(clube_id), dict(request.query_params)
    )
    lines = ["data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa"]
    for item in result.data:
        name = item.player_name.replace('"', '""')
        if ";" in name or '"' in item.player_name:
            name = f'"{name}"'

        def money(value: object) -> str:
            return "" if value is None else f"{value:.2f}".replace(".", ",")

        lines.append(
            ";".join(
                [
                    item.created_at,
                    item.type,
                    name,
                    money(item.value),
                    money(item.fee),
                    money(item.penalty),
                    money(item.profit),
                    money(item.cash_change),
                ]
            )
        )
    return Response("\n".join(lines) + "\n", media_type="text/csv")
