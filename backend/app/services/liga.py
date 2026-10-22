from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models import DueloPartida, Escalacao, Partida
from app.repositories.liga import LigaRepository
from app.schemas.liga import FORMATIONS, LineupUpdate, MatchCreate
from app.services.jogador import JogadorService
from app.utils.datetime import format_brasilia, now_brasilia
from app.utils.texto import alphabetical_key, is_positive_integer

POSITION_ORDER = {"GOL": 0, "ZAG": 1, "LAT": 2, "MEI": 3, "ATA": 4}


class LigaService:
    def __init__(self, repository: LigaRepository | None = None) -> None:
        self.repository = repository or LigaRepository()
        self.player_service = JogadorService()

    def save_lineup(self, session: Session, club_id: int, data: LineupUpdate) -> dict:
        with session.begin():
            club = self._club(session, club_id)
            players = self.repository.players(session, data.player_ids)
            if len(players) != 5:
                raise DomainError("Jogador não encontrado.", 404)
            if any(player.clube_id != club.id for player in players) or any(
                player.condicao == "DOENTE" for player in players
            ):
                raise DomainError("Jogador não pode ser escalado.")
            self._validate_formation(players, data.formation)
            self.repository.delete_lineup(session, club.id)
            club.formacao = data.formation
            session.add_all(
                [
                    Escalacao(clube_id=club.id, jogador_id=player.id)
                    for player in players
                ]
            )
        return self.get_lineup(session, club.id)

    def get_lineup(self, session: Session, club_id: int) -> dict:
        club = self._club(session, club_id)
        players = self._ordered(self.repository.lineup(session, club.id))
        return {
            "club_id": club.id,
            "formation": club.formacao,
            "complete": len(players) == 5,
            "players": [
                self.player_service.to_response(player).model_dump(mode="json")
                for player in players
            ],
        }

    def play(self, session: Session, data: MatchCreate) -> dict:
        with session.begin():
            home = self._club(session, data.home_club_id)
            away = self._club(session, data.away_club_id)
            home_players, away_players = self._complete_lineups(
                session, home.id, away.id
            )
            duels, home_goals, away_goals = self._build_duels(
                home.id, away.id, home_players, away_players
            )
            match = Partida(
                mandante_id=home.id,
                visitante_id=away.id,
                gols_mandante=home_goals,
                gols_visitante=away_goals,
                formacao_mandante=home.formacao,
                formacao_visitante=away.formacao,
                jogada_em=now_brasilia(),
            )
            session.add(match)
            session.flush()
            session.add_all(
                [DueloPartida(partida_id=match.id, **duel) for duel in duels]
            )
            session.flush()
            result = self._match_response(session, match, include_duels=True)
        return result

    def list_matches(self, session: Session, params: dict[str, str]) -> list[dict]:
        club_id = None
        if "club_id" in params:
            if not is_positive_integer(params["club_id"]):
                raise DomainError("Parâmetro club_id inválido.", 400)
            club_id = int(params["club_id"])
            self._club(session, club_id)
        return [
            self._match_response(session, match, include_duels=False)
            for match in self.repository.matches(session, club_id)
        ]

    def find_match(self, session: Session, match_id: int) -> dict:
        match = self.repository.match(session, match_id)
        if match is None:
            raise DomainError("Partida não encontrada.", 404)
        return self._match_response(session, match, include_duels=True)

    def standings(self, session: Session) -> list[dict]:
        rows = {
            club.id: {
                "club_id": club.id,
                "club_name": club.nome,
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals_for": 0,
                "goals_against": 0,
                "points": 0,
            }
            for club in self.repository.clubs(session)
        }
        for match in self.repository.matches(session):
            home, away = rows[match.mandante_id], rows[match.visitante_id]
            for row, goals_for, goals_against in (
                (home, match.gols_mandante, match.gols_visitante),
                (away, match.gols_visitante, match.gols_mandante),
            ):
                row["played"] += 1
                row["goals_for"] += goals_for
                row["goals_against"] += goals_against
            if match.gols_mandante > match.gols_visitante:
                home["wins"] += 1
                home["points"] += 3
                away["losses"] += 1
            elif match.gols_mandante < match.gols_visitante:
                away["wins"] += 1
                away["points"] += 3
                home["losses"] += 1
            else:
                home["draws"] += 1
                away["draws"] += 1
                home["points"] += 1
                away["points"] += 1
        result = list(rows.values())
        for row in result:
            row["goal_difference"] = row["goals_for"] - row["goals_against"]
        result.sort(
            key=lambda row: (
                -row["points"],
                -row["goal_difference"],
                -row["goals_for"],
                alphabetical_key(row["club_name"]),
                row["club_id"],
            )
        )
        for position, row in enumerate(result, 1):
            row["position"] = position
        return result

    def _complete_lineups(self, session: Session, home_id: int, away_id: int):
        home, away = (
            self._ordered(self.repository.lineup(session, home_id)),
            self._ordered(self.repository.lineup(session, away_id)),
        )
        if len(home) != 5 or len(away) != 5:
            raise DomainError("Clube sem escalação completa.")
        return home, away

    def _build_duels(self, home_id: int, away_id: int, home: list, away: list):
        data, home_goals, away_goals = [], 0, 0
        for order, attack_id, attack, defend in [
            (1, home_id, home[4], away[0]),
            (2, home_id, home[3], away[1]),
            (3, home_id, home[2], away[2]),
            (4, away_id, away[4], home[0]),
            (5, away_id, away[3], home[1]),
            (6, away_id, away[2], home[2]),
        ]:
            attribute = {
                "ATA": "shooting",
                "MEI": "passing",
                "ZAG": "dribbling",
                "LAT": "dribbling",
            }[attack.posicao]
            attack_value = self._value(attack, attribute)
            defense_value = self._value(defend, "defending")
            goal = attack_value > defense_value
            if goal:
                if attack_id == home_id:
                    home_goals += 1
                else:
                    away_goals += 1
            data.append(
                {
                    "ordem": order,
                    "clube_atacante_id": attack_id,
                    "atacante_id": attack.id,
                    "defensor_id": defend.id,
                    "nome_atacante": attack.nome,
                    "nome_defensor": defend.nome,
                    "posicao_atacante": attack.posicao,
                    "posicao_defensor": defend.posicao,
                    "condicao_atacante": attack.condicao,
                    "condicao_defensor": defend.condicao,
                    "atributo_ataque": attribute,
                    "atributo_defesa": "defending",
                    "valor_ataque": attack_value,
                    "valor_defesa": defense_value,
                    "gol": goal,
                }
            )
        return data, home_goals, away_goals

    def _match_response(
        self, session: Session, match: Partida, include_duels: bool
    ) -> dict:
        home, away = (
            self._club(session, match.mandante_id),
            self._club(session, match.visitante_id),
        )
        result = (
            "EMPATE"
            if match.gols_mandante == match.gols_visitante
            else (
                "MANDANTE"
                if match.gols_mandante > match.gols_visitante
                else "VISITANTE"
            )
        )
        data = {
            "id": match.id,
            "played_at": format_brasilia(match.jogada_em),
            "home": {
                "club_id": home.id,
                "club_name": home.nome,
                "formation": match.formacao_mandante,
                "goals": match.gols_mandante,
            },
            "away": {
                "club_id": away.id,
                "club_name": away.nome,
                "formation": match.formacao_visitante,
                "goals": match.gols_visitante,
            },
            "result": result,
        }
        if include_duels:
            data["duels"] = [
                self._duel_response(duel)
                for duel in self.repository.duels(session, match.id)
            ]
        return data

    @staticmethod
    def _duel_response(duel) -> dict:
        return {
            "order": duel.ordem,
            "attacking_club_id": duel.clube_atacante_id,
            "attacker": {
                "player_id": duel.atacante_id,
                "player_name": duel.nome_atacante,
                "position": duel.posicao_atacante,
                "condition": duel.condicao_atacante,
                "attribute": duel.atributo_ataque,
                "value": duel.valor_ataque,
            },
            "defender": {
                "player_id": duel.defensor_id,
                "player_name": duel.nome_defensor,
                "position": duel.posicao_defensor,
                "condition": duel.condicao_defensor,
                "attribute": duel.atributo_defesa,
                "value": duel.valor_defesa,
            },
            "goal": duel.gol,
        }

    @staticmethod
    def _value(player, attribute: str) -> int:
        fields = {
            "shooting": player.finalizacao,
            "passing": player.passe,
            "dribbling": player.drible,
            "defending": player.defesa,
        }
        value = fields[attribute]
        return (
            int(
                (Decimal(value) * Decimal("0.85")).quantize(
                    Decimal("1"), rounding=ROUND_HALF_UP
                )
            )
            if player.condicao == "MAL_CONDICIONADO"
            else value
        )

    @staticmethod
    def _ordered(players: list) -> list:
        return sorted(
            players,
            key=lambda player: (
                POSITION_ORDER[player.posicao],
                alphabetical_key(player.nome),
                player.id,
            ),
        )

    @staticmethod
    def _validate_formation(players: list, formation: str) -> None:
        defense, middle, attack = FORMATIONS[formation]
        counts = {"GOL": 0, "DEF": 0, "MEI": 0, "ATA": 0}
        for player in players:
            counts["DEF" if player.posicao in {"ZAG", "LAT"} else player.posicao] += 1
        if (counts["GOL"], counts["DEF"], counts["MEI"], counts["ATA"]) != (
            1,
            defense,
            middle,
            attack,
        ):
            raise DomainError("Posições não fecham a formação.")

    def _club(self, session: Session, club_id: int):
        club = self.repository.club(session, club_id)
        if club is None:
            raise DomainError("Clube não encontrado.", 404)
        return club
