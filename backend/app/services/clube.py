from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import Clube, Contrato
from app.repositories.clube import ClubeRepository
from app.schemas.clube import ClubeCreate, ClubeDetailResponse, ClubeResponse
from app.services.calculos_jogador import calculate_market_value, round_currency
from app.services.calculos_mercado import calculate_penalty
from app.services.jogador import JogadorService
from app.utils.datetime import format_brasilia, now_brasilia, remaining_days
from app.utils.texto import alphabetical_key, normalize_text, remove_accents

POSITION_ORDER = {"GOL": 0, "ZAG": 1, "LAT": 2, "MEI": 3, "ATA": 4}


class ClubeService:
    def __init__(self, repository: ClubeRepository | None = None) -> None:
        self.repository = repository or ClubeRepository()
        self.player_service = JogadorService()

    def create(self, session: Session, data: ClubeCreate) -> ClubeResponse:
        normalized_name = normalize_text(data.name).lower()
        if self.repository.count(session) >= 20:
            raise DomainError("Limite de clubes atingido.")
        if (
            self.repository.find_by_normalized_name(session, normalized_name)
            is not None
        ):
            raise DomainError("Nome de clube já cadastrado.")
        if self.repository.find_by_acronym(session, data.acronym) is not None:
            raise DomainError("Sigla de clube já cadastrada.")
        if not self._acronym_matches_name(data.acronym, data.name):
            raise DomainError("A sigla não corresponde ao nome do clube.", 400)
        club = Clube(
            nome=data.name,
            nome_normalizado=normalized_name,
            sigla=data.acronym,
            caixa=Decimal("300.00"),
        )
        return self.to_response(session, self.repository.create(session, club))

    def list(self, session: Session, sort: str) -> list[ClubeResponse]:
        if sort not in {"name", "net_worth_asc", "net_worth_desc"}:
            raise DomainError("Parâmetro sort inválido.", 400)
        clubs = self.repository.list_all(session)
        responses = [self.to_response(session, club) for club in clubs]
        if sort == "name":
            return sorted(
                responses, key=lambda item: (alphabetical_key(item.name), item.id)
            )
        responses.sort(key=lambda item: (alphabetical_key(item.name), item.id))
        return sorted(
            responses,
            key=lambda item: item.net_worth,
            reverse=sort == "net_worth_desc",
        )

    def find(self, session: Session, clube_id: int) -> ClubeDetailResponse:
        club = self._get_club(session, clube_id)
        response = self.to_response(session, club)
        players = self.repository.list_players(session, club.id)
        players.sort(
            key=lambda player: (
                POSITION_ORDER[player.posicao],
                alphabetical_key(player.nome),
                player.id,
            )
        )
        now = now_brasilia()
        player_data = []
        for player in players:
            data = self.player_service.to_response(player).model_dump(mode="json")
            contract = (
                session.query(Contrato)
                .filter_by(jogador_id=player.id, situacao="ATIVO")
                .first()
            )
            if contract:
                days = remaining_days(contract.fidelidade_ate, now)
                rate, _ = calculate_penalty(data["market_value"], days)
                data["contract"] = {
                    "purchase_value": contract.valor_compra,
                    "loyalty_until": format_brasilia(contract.fidelidade_ate),
                    "remaining_days": days,
                    "penalty_rate": rate,
                }
            player_data.append(data)
        return ClubeDetailResponse(**response.model_dump(), players=player_data)

    def to_response(self, session: Session, club: Clube) -> ClubeResponse:
        squad_value = round_currency(
            sum(
                (
                    calculate_market_value(
                        player.valor_base,
                        player.condicao,
                        player.agilidade,
                        player.idade,
                    )
                    for player in self.repository.list_players(session, club.id)
                ),
                Decimal("0"),
            )
        )
        return ClubeResponse(
            id=club.id,
            name=club.nome,
            acronym=club.sigla,
            cash=club.caixa,
            squad_value=squad_value,
            net_worth=round_currency(club.caixa + squad_value),
        )

    def _get_club(self, session: Session, clube_id: int) -> Clube:
        club = self.repository.find(session, clube_id)
        if club is None:
            raise DomainError("Clube não encontrado.", 404)
        return club

    @staticmethod
    def _acronym_matches_name(acronym: str, name: str) -> bool:
        plain_name = remove_accents(name).upper()
        if acronym[0] != plain_name[0] or len(set(acronym)) == 1:
            return False
        letters = iter(character for character in plain_name if character.isalpha())
        return all(
            any(character == letter for character in letters) for letter in acronym
        )
