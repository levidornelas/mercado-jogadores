import math
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import Jogador
from app.repositories.jogador import JogadorRepository
from app.schemas.jogador import (
    CondicaoUpdate,
    JogadorCreate,
    JogadorListResponse,
    JogadorResponse,
    JogadorUpdate,
    PaginationMeta,
)
from app.services.calculos_jogador import (
    calculate_base_value,
    calculate_market_value,
    calculate_overall,
)
from app.utils.texto import (
    alphabetical_key,
    is_positive_integer,
    validate_search,
)

PADRAO_DECIMAL = re.compile(r"(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$")
ORDENS_ACEITAS = {"name", "value_asc", "value_desc", "age_asc", "age_desc", "position"}
ORDEM_POSICAO = {"GOL": 0, "ZAG": 1, "LAT": 2, "MEI": 3, "ATA": 4}


@dataclass(frozen=True)
class JogadorFilters:
    search: str | None
    position: str | None
    condition: str | None
    free: bool | None
    clube_id: int | None
    min_age: int | None
    max_age: int | None
    min_value: Decimal | None
    max_value: Decimal | None
    sort: tuple[str, ...]
    page: int
    limit: int


class JogadorService:
    def __init__(self, repository: JogadorRepository | None = None) -> None:
        self.repository = repository or JogadorRepository()

    def create(self, session: Session, data: JogadorCreate) -> JogadorResponse:
        overall = calculate_overall(
            data.position,
            data.pace,
            data.shooting,
            data.passing,
            data.dribbling,
            data.defending,
            data.physical,
        )
        player = Jogador(
            nome=data.name,
            posicao=data.position,
            agilidade=data.agility,
            idade=data.age,
            valor_base=calculate_base_value(overall, data.potential, data.age),
            condicao="APTO",
            velocidade=data.pace,
            finalizacao=data.shooting,
            passe=data.passing,
            drible=data.dribbling,
            defesa=data.defending,
            fisico=data.physical,
            potencial=data.potential,
        )
        return self.to_response(self.repository.create(session, player))

    def find(self, session: Session, jogador_id: int) -> JogadorResponse:
        return self.to_response(self._get_active(session, jogador_id))

    def update(
        self, session: Session, jogador_id: int, data: JogadorUpdate
    ) -> JogadorResponse:
        player = self._get_active(session, jogador_id)
        if data.age < player.idade:
            raise DomainError("A idade não pode diminuir.")
        if player.clube_id is not None and data.position != player.posicao:
            raise DomainError("Jogador com clube não pode mudar de posição.")
        player.nome = data.name
        player.posicao = data.position
        player.agilidade = data.agility
        player.idade = data.age
        return self.to_response(self.repository.save(session, player))

    def update_condition(
        self, session: Session, jogador_id: int, data: CondicaoUpdate
    ) -> JogadorResponse:
        player = self._get_active(session, jogador_id)
        if player.condicao == "DOENTE" and data.condition == "APTO":
            raise DomainError("Jogador doente não pode voltar diretamente a APTO.")
        player.condicao = data.condition
        if data.condition == "DOENTE":
            self.repository.remove_from_lineup(session, player.id)
        return self.to_response(self.repository.save(session, player))

    def delete(self, session: Session, jogador_id: int) -> None:
        player = self._get_active(session, jogador_id)
        if player.clube_id is not None:
            raise DomainError("Jogador com clube não pode ser excluído.")
        player.excluido_em = datetime.now(UTC)
        self.repository.save(session, player)

    def list(
        self, session: Session, query_params: dict[str, str]
    ) -> JogadorListResponse:
        filters = self.validate_filters(query_params, session)
        players = [
            player
            for player in self.repository.list_active(session)
            if self._matches_filters(player, filters)
        ]
        sorted_players = self._sort(players, filters.sort)
        total_items = len(sorted_players)
        start = (filters.page - 1) * filters.limit
        page_items = sorted_players[start : start + filters.limit]
        return JogadorListResponse(
            data=[self.to_response(player) for player in page_items],
            meta=PaginationMeta(
                page=filters.page,
                limit=filters.limit,
                total_items=total_items,
                total_pages=math.ceil(total_items / filters.limit),
            ),
        )

    def validate_filters(
        self, query_params: dict[str, str], session: Session
    ) -> JogadorFilters:
        search = self._get_search(query_params, "search")
        position = self._get_enum(
            query_params, "position", {"GOL", "ZAG", "LAT", "MEI", "ATA"}
        )
        condition = self._get_enum(
            query_params, "condition", {"APTO", "MAL_CONDICIONADO", "DOENTE"}
        )
        free = self._get_boolean(query_params, "free")
        clube_id = self._get_integer(query_params, "club_id")
        if clube_id is not None and not self.repository.club_exists(session, clube_id):
            raise DomainError("Clube não encontrado.", 404)
        if free is True and clube_id is not None:
            raise DomainError("Os filtros free=true e club_id são incompatíveis.", 400)
        min_age = self._get_integer(query_params, "min_age")
        max_age = self._get_integer(query_params, "max_age")
        self._validate_range(min_age, max_age, 16, 45, "idade")
        min_value = self._get_decimal(query_params, "min_value")
        max_value = self._get_decimal(query_params, "max_value")
        self._validate_range(
            min_value, max_value, Decimal("0"), Decimal("550"), "valor"
        )
        sort = self._get_sort(query_params)
        page = self._get_integer(query_params, "page") or 1
        limit = self._get_integer(query_params, "limit") or 10
        if page < 1 or not 1 <= limit <= 50:
            raise DomainError("Paginação inválida.", 400)
        return JogadorFilters(
            search=search,
            position=position,
            condition=condition,
            free=free,
            clube_id=clube_id,
            min_age=min_age,
            max_age=max_age,
            min_value=min_value,
            max_value=max_value,
            sort=sort,
            page=page,
            limit=limit,
        )

    def to_response(self, player: Jogador) -> JogadorResponse:
        overall = calculate_overall(
            player.posicao,
            player.velocidade,
            player.finalizacao,
            player.passe,
            player.drible,
            player.defesa,
            player.fisico,
        )
        return JogadorResponse(
            id=player.id,
            name=player.nome,
            position=player.posicao,
            agility=player.agilidade,
            age=player.idade,
            condition=player.condicao,
            base_value=player.valor_base,
            market_value=calculate_market_value(
                player.valor_base,
                player.condicao,
                player.agilidade,
                player.idade,
            ),
            pace=player.velocidade,
            shooting=player.finalizacao,
            passing=player.passe,
            dribbling=player.drible,
            defending=player.defesa,
            physical=player.fisico,
            potential=player.potencial,
            overall=overall,
            club_id=player.clube_id,
        )

    def _get_active(self, session: Session, jogador_id: int) -> Jogador:
        player = self.repository.find_active(session, jogador_id)
        if player is None:
            raise DomainError("Jogador não encontrado.", 404)
        return player

    def _matches_filters(self, player: Jogador, filters: JogadorFilters) -> bool:
        response = self.to_response(player)
        if filters.search and alphabetical_key(filters.search) not in alphabetical_key(
            player.nome
        ):
            return False
        if filters.position and player.posicao != filters.position:
            return False
        if filters.condition and player.condicao != filters.condition:
            return False
        if filters.free is True and player.clube_id is not None:
            return False
        if filters.free is False and player.clube_id is None:
            return False
        if filters.clube_id is not None and player.clube_id != filters.clube_id:
            return False
        if filters.min_age is not None and player.idade < filters.min_age:
            return False
        if filters.max_age is not None and player.idade > filters.max_age:
            return False
        if filters.min_value is not None and response.market_value < filters.min_value:
            return False
        return filters.max_value is None or response.market_value <= filters.max_value

    def _sort(self, players: list[Jogador], sort: tuple[str, ...]) -> list[Jogador]:
        sorted_players = sorted(
            players, key=lambda player: (alphabetical_key(player.nome), player.id)
        )
        for criterion in reversed(sort):
            key, reverse = self._sort_key(criterion)
            sorted_players.sort(key=key, reverse=reverse)
        return sorted_players

    def _sort_key(self, criterion: str):
        if criterion == "name":
            return lambda player: alphabetical_key(player.nome), False
        if criterion == "position":
            return lambda player: ORDEM_POSICAO[player.posicao], False
        if criterion.startswith("value"):
            return (
                lambda player: calculate_market_value(
                    player.valor_base,
                    player.condicao,
                    player.agilidade,
                    player.idade,
                ),
                criterion == "value_desc",
            )
        return lambda player: player.idade, criterion == "age_desc"

    @staticmethod
    def _get_search(query_params: dict[str, str], name: str) -> str | None:
        value = query_params.get(name)
        if value is None:
            return None
        if value == "":
            raise DomainError("Parâmetro de busca inválido.", 400)
        return validate_search(value)

    @staticmethod
    def _get_enum(
        query_params: dict[str, str], name: str, accepted_values: set[str]
    ) -> str | None:
        value = query_params.get(name)
        if value is None:
            return None
        if value not in accepted_values:
            raise DomainError(f"Parâmetro {name} inválido.", 400)
        return value

    @staticmethod
    def _get_boolean(query_params: dict[str, str], name: str) -> bool | None:
        value = query_params.get(name)
        if value is None:
            return None
        if value == "true":
            return True
        if value == "false":
            return False
        raise DomainError(f"Parâmetro {name} inválido.", 400)

    @staticmethod
    def _get_integer(query_params: dict[str, str], name: str) -> int | None:
        value = query_params.get(name)
        if value is None:
            return None
        if not is_positive_integer(value):
            raise DomainError(f"Parâmetro {name} inválido.", 400)
        return int(value)

    @staticmethod
    def _get_decimal(query_params: dict[str, str], name: str) -> Decimal | None:
        value = query_params.get(name)
        if value is None:
            return None
        if not PADRAO_DECIMAL.fullmatch(value):
            raise DomainError(f"Parâmetro {name} inválido.", 400)
        return Decimal(value)

    @staticmethod
    def _validate_range(
        minimum: int | Decimal | None,
        maximum: int | Decimal | None,
        lower_limit: int | Decimal,
        upper_limit: int | Decimal,
        name: str,
    ) -> None:
        values = (minimum, maximum)
        if any(
            value is not None and not lower_limit <= value <= upper_limit
            for value in values
        ):
            raise DomainError(f"Faixa de {name} inválida.", 400)
        if minimum is not None and maximum is not None and minimum > maximum:
            raise DomainError(f"Faixa de {name} inválida.", 400)

    @staticmethod
    def _get_sort(query_params: dict[str, str]) -> tuple[str, ...]:
        value = query_params.get("sort", "name")
        items = value.split(",")
        fields = [item.split("_")[0] for item in items]
        if (
            not 1 <= len(items) <= 2
            or any(item not in ORDENS_ACEITAS for item in items)
            or len(set(fields)) != len(fields)
        ):
            raise DomainError("Parâmetro sort inválido.", 400)
        return tuple(items)
