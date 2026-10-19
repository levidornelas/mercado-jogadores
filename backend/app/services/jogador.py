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
    CondicaoAtualizacao,
    JogadorCriacao,
    JogadorEdicao,
    JogadorResposta,
    ListaJogadoresResposta,
    MetaPaginacao,
)
from app.services.calculos_jogador import (
    calcular_overall,
    calcular_valor_base,
    calcular_valor_mercado,
)
from app.utils.texto import (
    chave_alfabetica,
    is_integer,
    validar_busca,
)

PADRAO_DECIMAL = re.compile(r"(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$")
ORDENS_ACEITAS = {"name", "value_asc", "value_desc", "age_asc", "age_desc", "position"}
ORDEM_POSICAO = {"GOL": 0, "ZAG": 1, "LAT": 2, "MEI": 3, "ATA": 4}


@dataclass(frozen=True)
class FiltrosJogador:
    busca: str | None
    posicao: str | None
    condicao: str | None
    livre: bool | None
    clube_id: int | None
    idade_minima: int | None
    idade_maxima: int | None
    valor_minimo: Decimal | None
    valor_maximo: Decimal | None
    ordenacao: tuple[str, ...]
    pagina: int
    limite: int


class JogadorService:
    def __init__(self, repository: JogadorRepository | None = None) -> None:
        self.repository = repository or JogadorRepository()

    def create(self, sessao: Session, dados: JogadorCriacao) -> JogadorResposta:
        overall = calcular_overall(
            dados.position,
            dados.pace,
            dados.shooting,
            dados.passing,
            dados.dribbling,
            dados.defending,
            dados.physical,
        )
        jogador = Jogador(
            nome=dados.name,
            posicao=dados.position,
            agilidade=dados.agility,
            idade=dados.age,
            valor_base=calcular_valor_base(overall, dados.potential, dados.age),
            condicao="APTO",
            velocidade=dados.pace,
            finalizacao=dados.shooting,
            passe=dados.passing,
            drible=dados.dribbling,
            defesa=dados.defending,
            fisico=dados.physical,
            potencial=dados.potential,
        )
        return self.to_response(self.repository.create(sessao, jogador))

    def find(self, sessao: Session, jogador_id: int) -> JogadorResposta:
        return self.to_response(self._get_active(sessao, jogador_id))

    def update(
        self, sessao: Session, jogador_id: int, dados: JogadorEdicao
    ) -> JogadorResposta:
        jogador = self._get_active(sessao, jogador_id)
        if dados.age < jogador.idade:
            raise DomainError("A idade não pode diminuir.")
        if jogador.clube_id is not None and dados.position != jogador.posicao:
            raise DomainError("Jogador com clube não pode mudar de posição.")
        jogador.nome = dados.name
        jogador.posicao = dados.position
        jogador.agilidade = dados.agility
        jogador.idade = dados.age
        return self.to_response(self.repository.save(sessao, jogador))

    def update_condition(
        self, sessao: Session, jogador_id: int, dados: CondicaoAtualizacao
    ) -> JogadorResposta:
        jogador = self._get_active(sessao, jogador_id)
        if jogador.condicao == "DOENTE" and dados.condition == "APTO":
            raise DomainError("Jogador doente não pode voltar diretamente a APTO.")
        jogador.condicao = dados.condition
        if dados.condition == "DOENTE":
            self.repository.remove_from_lineup(sessao, jogador.id)
        return self.to_response(self.repository.save(sessao, jogador))

    def delete(self, sessao: Session, jogador_id: int) -> None:
        jogador = self._get_active(sessao, jogador_id)
        if jogador.clube_id is not None:
            raise DomainError("Jogador com clube não pode ser excluído.")
        jogador.excluido_em = datetime.now(UTC)
        self.repository.save(sessao, jogador)

    def list(
        self, sessao: Session, parametros: dict[str, str]
    ) -> ListaJogadoresResposta:
        filtros = self.validate_filters(parametros, sessao)
        jogadores = [
            jogador
            for jogador in self.repository.list_active(sessao)
            if self._matches_filters(jogador, filtros)
        ]
        jogadores_ordenados = self._sort(jogadores, filtros.ordenacao)
        total_itens = len(jogadores_ordenados)
        inicio = (filtros.pagina - 1) * filtros.limite
        pagina = jogadores_ordenados[inicio : inicio + filtros.limite]
        return ListaJogadoresResposta(
            data=[self.to_response(jogador) for jogador in pagina],
            meta=MetaPaginacao(
                page=filtros.pagina,
                limit=filtros.limite,
                total_items=total_itens,
                total_pages=math.ceil(total_itens / filtros.limite),
            ),
        )

    def validate_filters(
        self, parametros: dict[str, str], sessao: Session
    ) -> FiltrosJogador:
        busca = self._obter_busca(parametros, "search")
        posicao = self._obter_lista(
            parametros, "position", {"GOL", "ZAG", "LAT", "MEI", "ATA"}
        )
        condicao = self._obter_lista(
            parametros, "condition", {"APTO", "MAL_CONDICIONADO", "DOENTE"}
        )
        livre = self._obter_booleano(parametros, "free")
        clube_id = self._obter_inteiro(parametros, "club_id")
        if clube_id is not None and not self.repository.club_exists(sessao, clube_id):
            raise DomainError("Clube não encontrado.", 404)
        if livre is True and clube_id is not None:
            raise DomainError("Os filtros free=true e club_id são incompatíveis.", 400)
        idade_minima = self._obter_inteiro(parametros, "min_age")
        idade_maxima = self._obter_inteiro(parametros, "max_age")
        self._validar_faixa(idade_minima, idade_maxima, 16, 45, "idade")
        valor_minimo = self._obter_decimal(parametros, "min_value")
        valor_maximo = self._obter_decimal(parametros, "max_value")
        self._validar_faixa(
            valor_minimo, valor_maximo, Decimal("0"), Decimal("550"), "valor"
        )
        ordenacao = self._obter_ordenacao(parametros)
        pagina = self._obter_inteiro(parametros, "page") or 1
        limite = self._obter_inteiro(parametros, "limit") or 10
        if pagina < 1 or not 1 <= limite <= 50:
            raise DomainError("Paginação inválida.", 400)
        return FiltrosJogador(
            busca=busca,
            posicao=posicao,
            condicao=condicao,
            livre=livre,
            clube_id=clube_id,
            idade_minima=idade_minima,
            idade_maxima=idade_maxima,
            valor_minimo=valor_minimo,
            valor_maximo=valor_maximo,
            ordenacao=ordenacao,
            pagina=pagina,
            limite=limite,
        )

    def to_response(self, jogador: Jogador) -> JogadorResposta:
        overall = calcular_overall(
            jogador.posicao,
            jogador.velocidade,
            jogador.finalizacao,
            jogador.passe,
            jogador.drible,
            jogador.defesa,
            jogador.fisico,
        )
        return JogadorResposta(
            id=jogador.id,
            name=jogador.nome,
            position=jogador.posicao,
            agility=jogador.agilidade,
            age=jogador.idade,
            condition=jogador.condicao,
            base_value=jogador.valor_base,
            market_value=calcular_valor_mercado(
                jogador.valor_base,
                jogador.condicao,
                jogador.agilidade,
                jogador.idade,
            ),
            pace=jogador.velocidade,
            shooting=jogador.finalizacao,
            passing=jogador.passe,
            dribbling=jogador.drible,
            defending=jogador.defesa,
            physical=jogador.fisico,
            potential=jogador.potencial,
            overall=overall,
            club_id=jogador.clube_id,
        )

    def _get_active(self, sessao: Session, jogador_id: int) -> Jogador:
        jogador = self.repository.find_active(sessao, jogador_id)
        if jogador is None:
            raise DomainError("Jogador não encontrado.", 404)
        return jogador

    def _matches_filters(self, jogador: Jogador, filtros: FiltrosJogador) -> bool:
        resposta = self.to_response(jogador)
        if filtros.busca and chave_alfabetica(filtros.busca) not in chave_alfabetica(
            jogador.nome
        ):
            return False
        if filtros.posicao and jogador.posicao != filtros.posicao:
            return False
        if filtros.condicao and jogador.condicao != filtros.condicao:
            return False
        if filtros.livre is True and jogador.clube_id is not None:
            return False
        if filtros.livre is False and jogador.clube_id is None:
            return False
        if filtros.clube_id is not None and jogador.clube_id != filtros.clube_id:
            return False
        if filtros.idade_minima is not None and jogador.idade < filtros.idade_minima:
            return False
        if filtros.idade_maxima is not None and jogador.idade > filtros.idade_maxima:
            return False
        if (
            filtros.valor_minimo is not None
            and resposta.market_value < filtros.valor_minimo
        ):
            return False
        return (
            filtros.valor_maximo is None
            or resposta.market_value <= filtros.valor_maximo
        )

    def _sort(
        self, jogadores: list[Jogador], ordenacao: tuple[str, ...]
    ) -> list[Jogador]:
        resultado = sorted(
            jogadores, key=lambda jogador: (chave_alfabetica(jogador.nome), jogador.id)
        )
        for criterio in reversed(ordenacao):
            chave, reverso = self._sort_key(criterio)
            resultado.sort(key=chave, reverse=reverso)
        return resultado

    def _sort_key(self, criterio: str):
        if criterio == "name":
            return lambda jogador: chave_alfabetica(jogador.nome), False
        if criterio == "position":
            return lambda jogador: ORDEM_POSICAO[jogador.posicao], False
        if criterio.startswith("value"):
            return (
                lambda jogador: calcular_valor_mercado(
                    jogador.valor_base,
                    jogador.condicao,
                    jogador.agilidade,
                    jogador.idade,
                ),
                criterio == "value_desc",
            )
        return lambda jogador: jogador.idade, criterio == "age_desc"

    @staticmethod
    def _obter_busca(parametros: dict[str, str], nome: str) -> str | None:
        valor = parametros.get(nome)
        if valor is None:
            return None
        if valor == "":
            raise DomainError("Parâmetro de busca inválido.", 400)
        return validar_busca(valor)

    @staticmethod
    def _obter_lista(
        parametros: dict[str, str], nome: str, valores_aceitos: set[str]
    ) -> str | None:
        valor = parametros.get(nome)
        if valor is None:
            return None
        if valor not in valores_aceitos:
            raise DomainError(f"Parâmetro {nome} inválido.", 400)
        return valor

    @staticmethod
    def _obter_booleano(parametros: dict[str, str], nome: str) -> bool | None:
        valor = parametros.get(nome)
        if valor is None:
            return None
        if valor == "true":
            return True
        if valor == "false":
            return False
        raise DomainError(f"Parâmetro {nome} inválido.", 400)

    @staticmethod
    def _obter_inteiro(parametros: dict[str, str], nome: str) -> int | None:
        valor = parametros.get(nome)
        if valor is None:
            return None
        if not is_integer(valor):
            raise DomainError(f"Parâmetro {nome} inválido.", 400)
        return int(valor)

    @staticmethod
    def _obter_decimal(parametros: dict[str, str], nome: str) -> Decimal | None:
        valor = parametros.get(nome)
        if valor is None:
            return None
        if not PADRAO_DECIMAL.fullmatch(valor):
            raise DomainError(f"Parâmetro {nome} inválido.", 400)
        return Decimal(valor)

    @staticmethod
    def _validar_faixa(
        minimo: int | Decimal | None,
        maximo: int | Decimal | None,
        limite_inferior: int | Decimal,
        limite_superior: int | Decimal,
        nome: str,
    ) -> None:
        valores = (minimo, maximo)
        if any(
            valor is not None and not limite_inferior <= valor <= limite_superior
            for valor in valores
        ):
            raise DomainError(f"Faixa de {nome} inválida.", 400)
        if minimo is not None and maximo is not None and minimo > maximo:
            raise DomainError(f"Faixa de {nome} inválida.", 400)

    @staticmethod
    def _obter_ordenacao(parametros: dict[str, str]) -> tuple[str, ...]:
        valor = parametros.get("sort", "name")
        itens = valor.split(",")
        campos = [item.split("_")[0] for item in itens]
        if (
            not 1 <= len(itens) <= 2
            or any(item not in ORDENS_ACEITAS for item in itens)
            or len(set(campos)) != len(campos)
        ):
            raise DomainError("Parâmetro sort inválido.", 400)
        return tuple(itens)
