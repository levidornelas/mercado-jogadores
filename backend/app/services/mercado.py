from datetime import timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import Contrato, Transacao
from app.repositories.mercado import MercadoRepository
from app.schemas.mercado import (
    CompraCreate,
    TransactionListResponse,
    TransactionSummary,
)
from app.services.calculos_jogador import calculate_market_value, round_currency
from app.services.calculos_mercado import (
    calculate_commission,
    calculate_penalty,
    calculate_purchase_fee,
)
from app.utils.datetime import (
    format_brasilia,
    now_brasilia,
    parse_loyalty_until,
    remaining_days,
)
from app.utils.texto import is_positive_integer


class MercadoService:
    def __init__(self, repository: MercadoRepository | None = None) -> None:
        self.repository = repository or MercadoRepository()

    def buy(self, session: Session, player_id: int, data: CompraCreate) -> dict:
        now = now_brasilia()
        until = parse_loyalty_until(data.loyalty_until)
        if not now < until <= now + timedelta(days=1095):
            raise DomainError("Fim da fidelidade inválido.", 400)
        with session.begin():
            player = self._player(session, player_id)
            club = self._club(session, data.club_id)
            if player.clube_id is not None:
                raise DomainError("Jogador não está livre.")
            if self.repository.squad_size(session, club.id) >= 12:
                raise DomainError("Limite de elenco atingido.")
            if self.repository.was_sold_by(session, club.id, player.id):
                raise DomainError("O clube não pode recomprar este jogador.")
            value = calculate_market_value(
                player.valor_base, player.condicao, player.agilidade, player.idade
            )
            fee = calculate_purchase_fee(value)
            cost = value + fee
            if cost > club.caixa / 2:
                raise DomainError("Custo acima do limite de 50% do caixa.")
            club.caixa -= cost
            player.clube_id = club.id
            contract = Contrato(
                jogador_id=player.id,
                clube_id=club.id,
                valor_compra=value,
                fidelidade_ate=until,
                situacao="ATIVO",
            )
            transaction = Transacao(
                clube_id=club.id,
                jogador_id=player.id,
                nome_jogador=player.nome,
                tipo="COMPRA",
                valor=value,
                taxa=fee,
                multa=Decimal("0.00"),
                lucro=None,
                variacao_caixa=-cost,
            )
            session.add_all([contract, transaction])
            session.flush()
            result = self.to_response(transaction)
            result.update(
                contract={
                    "purchase_value": value,
                    "loyalty_until": format_brasilia(until),
                    "status": "ATIVO",
                },
                club_cash=club.caixa,
            )
        return result

    def sell(self, session: Session, player_id: int) -> dict:
        now = now_brasilia()
        with session.begin():
            player = self._player(session, player_id)
            if player.clube_id is None:
                raise DomainError("Jogador está livre.")
            club = self._club(session, player.clube_id)
            contract = self.repository.active_contract(session, player.id)
            if contract is None:
                raise DomainError("Contrato ativo não encontrado.")
            value = calculate_market_value(
                player.valor_base, player.condicao, player.agilidade, player.idade
            )
            days = remaining_days(contract.fidelidade_ate, now)
            rate, penalty = calculate_penalty(value, days)
            profit = round_currency(value - contract.valor_compra)
            fee = calculate_commission(profit)
            credit = round_currency(value - penalty - fee)
            club.caixa += credit
            player.clube_id = None
            contract.situacao = "RESCINDIDO" if penalty else "ENCERRADO"
            contract.encerrado_em = now
            self.repository.remove_lineup(session, player.id)
            transaction = Transacao(
                clube_id=club.id,
                jogador_id=player.id,
                nome_jogador=player.nome,
                tipo="VENDA",
                valor=value,
                taxa=fee,
                multa=penalty,
                lucro=profit,
                variacao_caixa=credit,
            )
            session.add(transaction)
            session.flush()
            result = self.to_response(transaction)
            result.update(
                purchase_value=contract.valor_compra,
                remaining_days=days,
                penalty_rate=rate,
                contract_status=contract.situacao,
                club_cash=club.caixa,
            )
        return result

    def list_transactions(
        self, session: Session, club_id: int, params: dict[str, str]
    ) -> TransactionListResponse:
        self._club(session, club_id)
        types, player_id = self._filters(session, params)
        transactions = self.repository.transactions(session, club_id, types, player_id)
        zero = Decimal("0.00")
        return TransactionListResponse(
            data=[self.to_response(item) for item in transactions],
            summary=TransactionSummary(
                total_spent=round_currency(
                    sum(
                        (
                            item.valor + item.taxa
                            for item in transactions
                            if item.tipo == "COMPRA"
                        ),
                        zero,
                    )
                ),
                total_received=round_currency(
                    sum(
                        (
                            item.variacao_caixa
                            for item in transactions
                            if item.tipo == "VENDA"
                        ),
                        zero,
                    )
                ),
                total_fees=round_currency(
                    sum((item.taxa for item in transactions), zero)
                ),
                total_penalties=round_currency(
                    sum(
                        (item.multa for item in transactions if item.tipo == "VENDA"),
                        zero,
                    )
                ),
                total_profit=round_currency(
                    sum(
                        (
                            item.lucro or zero
                            for item in transactions
                            if item.tipo == "VENDA"
                        ),
                        zero,
                    )
                ),
            ),
        )

    def to_response(self, item: Transacao) -> dict:
        return dict(
            id=item.id,
            club_id=item.clube_id,
            player_id=item.jogador_id,
            player_name=item.nome_jogador,
            type=item.tipo,
            value=item.valor,
            fee=item.taxa,
            penalty=item.multa,
            profit=item.lucro,
            cash_change=item.variacao_caixa,
            created_at=format_brasilia(item.criado_em or now_brasilia()),
        )

    def _filters(
        self, session: Session, params: dict[str, str]
    ) -> tuple[set[str] | None, int | None]:
        raw_types = params.get("type")
        types = None
        if raw_types is not None:
            values = raw_types.split(",")
            if (
                not values
                or any(value not in {"COMPRA", "VENDA"} for value in values)
                or len(set(values)) != len(values)
            ):
                raise DomainError("Parâmetro type inválido.", 400)
            types = set(values)
        player_id = None
        if "player_id" in params:
            value = params["player_id"]
            if not is_positive_integer(value):
                raise DomainError("Parâmetro player_id inválido.", 400)
            player_id = int(value)
            self._player(session, player_id)
        return types, player_id

    def _player(self, session: Session, player_id: int):
        player = self.repository.player(session, player_id)
        if player is None:
            raise DomainError("Jogador não encontrado.", 404)
        return player

    def _club(self, session: Session, club_id: int):
        club = self.repository.club(session, club_id)
        if club is None:
            raise DomainError("Clube não encontrado.", 404)
        return club
