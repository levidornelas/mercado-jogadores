"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Goal,
  RefreshCw,
  Swords,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { dateTimeBr } from "@/lib/utils";
import type { Club, MatchDetail, MatchDuelPlayer } from "@/lib/types";

type FieldPlayer = Pick<
  MatchDuelPlayer,
  "player_id" | "player_name" | "position" | "condition"
>;

const fieldShape = {
  "3-1": [
    [8, 50],
    [23, 22],
    [23, 50],
    [23, 78],
    [42, 50],
  ],
  "2-2": [
    [8, 50],
    [23, 34],
    [23, 66],
    [42, 34],
    [42, 66],
  ],
  "2-1-1": [
    [8, 50],
    [23, 34],
    [23, 66],
    [33, 50],
    [42, 50],
  ],
  "1-2-1": [
    [8, 50],
    [23, 50],
    [33, 34],
    [33, 66],
    [42, 50],
  ],
} as const;
const positionOrder = { GOL: 0, ZAG: 1, LAT: 1, MEI: 2, ATA: 3 };

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const matchId = Number(params.id);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(
    searchParams.get("played") === "1",
  );

  const load = useCallback(async () => {
    if (!Number.isInteger(matchId) || matchId < 1) return;
    setLoading(true);
    setError(null);
    try {
      const [game, leagueClubs] = await Promise.all([
        api<MatchDetail>(`/matches/${matchId}`),
        api<Club[]>("/clubs"),
      ]);
      setMatch(game);
      setClubs(leagueClubs);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar os duelos desta partida.",
      );
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const acronymByClub = useMemo(
    () => new Map(clubs.map((club) => [club.id, club.acronym])),
    [clubs],
  );

  if (loading) {
    return (
      <section className="screen">
        <div className="table-state">Carregando partida...</div>
      </section>
    );
  }
  if (error || !match) {
    return (
      <section className="screen">
        <div className="table-state error-state">
          {error ?? "Partida não encontrada."}
          <Button variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  const homePlayers = lineupFor(match, match.home.club_id);
  const awayPlayers = lineupFor(match, match.away.club_id);
  const homeDuels = match.duels.filter(
    (duel) => duel.attacking_club_id === match.home.club_id,
  );
  const awayDuels = match.duels.filter(
    (duel) => duel.attacking_club_id === match.away.club_id,
  );

  return (
    <section className="screen match-detail-screen">
      <div className="app-topbar">
        <span>▣</span>
        <i />
        <span>Liga</span>
        <ChevronRight size={14} />
        <Link href="/matches">Partidas</Link>
        <ChevronRight size={14} />
        <b>
          {match.home.club_name} {match.home.goals} × {match.away.goals}{" "}
          {match.away.club_name}
        </b>
        <button onClick={() => void load()} aria-label="Atualizar partida">
          <RefreshCw size={17} />
        </button>
      </div>
      <Link href="/matches" className="back-to-matches">
        ← Voltar para partidas
      </Link>
      <section className="match-detail-summary card">
        <DetailTeam
          club={match.home}
          acronym={acronymByClub.get(match.home.club_id)}
          align="right"
        />
        <div className="match-detail-score">
          <strong>
            {match.home.goals} × {match.away.goals}
          </strong>
          <small>{dateTimeBr(match.played_at)}</small>
          <span>{resultLabel(match)}</span>
        </div>
        <DetailTeam
          club={match.away}
          acronym={acronymByClub.get(match.away.club_id)}
        />
      </section>

      <section className="match-field-card card">
        <header>
          <div>
            <h2>Em campo</h2>
            <p>
              Titulares de cada clube na formação da partida e os valores usados
              nos duelos, já com o efeito da condição.
            </p>
          </div>
          <div className="field-legend">
            <span>●</span> Mal condicionado <span>◉</span> Gol no duelo
          </div>
        </header>
        <MatchField
          match={match}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          homeAcronym={acronymByClub.get(match.home.club_id)}
          awayAcronym={acronymByClub.get(match.away.club_id)}
        />
      </section>

      <section className="duels-card card">
        <header>
          <h2>Duelos</h2>
          <p>
            Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de
            linha vão do 1º (mais recuado) ao 4º (mais avançado), pela ordem do
            elenco: o 4º ataca o goleiro, o 3º ataca o 1º e o 2º ataca o 2º.
          </p>
        </header>
        <DuelGroup
          title={`Ataques do ${match.home.club_name} (mandante)`}
          acronym={acronymByClub.get(match.home.club_id)}
          duels={homeDuels}
          goals={match.home.goals}
        />
        <DuelGroup
          title={`Ataques do ${match.away.club_name} (visitante)`}
          acronym={acronymByClub.get(match.away.club_id)}
          duels={awayDuels}
          goals={match.away.goals}
        />
      </section>

      {showToast && (
        <aside className="match-played-toast" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>
            <b>Partida jogada</b>
            <small>
              {match.home.club_name} {match.home.goals} × {match.away.goals}{" "}
              {match.away.club_name}. Placar e duelos devolvidos pela API.
            </small>
          </span>
          <button onClick={() => setShowToast(false)} aria-label="Fechar">
            <X size={14} />
          </button>
        </aside>
      )}
    </section>
  );
}

function DetailTeam({
  club,
  acronym,
  align,
}: {
  club: MatchDetail["home"];
  acronym?: string;
  align?: "right";
}) {
  return (
    <div className={`detail-team ${align === "right" ? "right" : ""}`}>
      <i>{acronym ?? club.club_name.slice(0, 3).toUpperCase()}</i>
      <span>
        <b>{club.club_name}</b>
        <small>
          {align === "right" ? "Mandante" : "Visitante"} · {club.formation}
        </small>
      </span>
    </div>
  );
}

function MatchField({
  match,
  homePlayers,
  awayPlayers,
  homeAcronym,
  awayAcronym,
}: {
  match: MatchDetail;
  homePlayers: FieldPlayer[];
  awayPlayers: FieldPlayer[];
  homeAcronym?: string;
  awayAcronym?: string;
}) {
  return (
    <div className="duel-field">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect
          x="1"
          y="5"
          width="98"
          height="90"
          rx="1"
          className="pitch-outline"
        />
        <path
          d="M50 5v90M1 50h98M50 38a12 12 0 1 0 0 24a12 12 0 1 0 0-24M1 32h9v36H1M99 32h-9v36h9M1 40h4v20H1M99 40h-4v20h4"
          className="pitch-lines"
        />
      </svg>
      <span className="field-team-label home">
        ● {homeAcronym ?? match.home.club_name} · {match.home.formation} · ataca
        →
      </span>
      <span className="field-team-label away">
        ● {awayAcronym ?? match.away.club_name} · {match.away.formation} · ←
        ataca
      </span>
      <FieldSide
        players={homePlayers}
        duels={match.duels}
        formation={match.home.formation}
        side="home"
      />
      <FieldSide
        players={awayPlayers}
        duels={match.duels}
        formation={match.away.formation}
        side="away"
      />
    </div>
  );
}

function FieldSide({
  players,
  duels,
  formation,
  side,
}: {
  players: FieldPlayer[];
  duels: MatchDetail["duels"];
  formation: string;
  side: "home" | "away";
}) {
  const points =
    fieldShape[formation as keyof typeof fieldShape] ?? fieldShape["2-1-1"];
  return (
    <>
      {players.map((player, index) => {
        const [originX, y] = points[index] ?? [8, 50];
        const x = side === "home" ? originX : 100 - originX;
        return (
          <span
            key={player.player_id}
            className={`duel-field-player ${side} ${player.condition === "MAL_CONDICIONADO" ? "tired" : ""}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <i>{initials(player.player_name)}</i>
            {player.condition === "MAL_CONDICIONADO" && <em>●</em>}
            <b>{player.player_name}</b>
            <small>
              {player.position} · {fieldValue(player, duels)}
            </small>
          </span>
        );
      })}
    </>
  );
}

function DuelGroup({
  title,
  acronym,
  duels,
  goals,
}: {
  title: string;
  acronym?: string;
  duels: MatchDetail["duels"];
  goals: number;
}) {
  return (
    <div className="duel-group">
      <header>
        <span>
          <i>{acronym ?? "CLB"}</i>
          <b>{title}</b>
        </span>
        <strong>
          {goals} {goals === 1 ? "gol" : "gols"}
        </strong>
      </header>
      <div className="duels-table-wrap">
        <table className="duels-table">
          <thead>
            <tr>
              <th>Duelo</th>
              <th>Atacante</th>
              <th>Ataque</th>
              <th>Defensor</th>
              <th>Defesa</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {duels.map((duel) => (
              <tr key={duel.order}>
                <td>
                  <span className="duel-order">{duel.order}</span>
                </td>
                <td>
                  <DuelPlayer player={duel.attacker} />
                </td>
                <td>
                  {attributeLabel(duel.attacker.attribute)}{" "}
                  <b>{duel.attacker.value}</b>
                </td>
                <td>
                  <DuelPlayer player={duel.defender} />
                </td>
                <td>
                  Defesa <b>{duel.defender.value}</b>
                </td>
                <td>
                  <span
                    className={duel.goal ? "duel-result goal" : "duel-result"}
                  >
                    {duel.goal ? "◉ Gol" : "Sem gol"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DuelPlayer({ player }: { player: MatchDuelPlayer }) {
  return (
    <span className="duel-player">
      <i className={`duel-avatar avatar-${player.player_id % 4}`}>
        {initials(player.player_name)}
      </i>
      <span>
        <b>{player.player_name}</b>
        <small>
          {player.position} ·{" "}
          {player.condition === "MAL_CONDICIONADO"
            ? "Mal condicionado"
            : "Em dia"}
        </small>
      </span>
    </span>
  );
}
function lineupFor(match: MatchDetail, clubId: number) {
  const items = new Map<number, FieldPlayer>();
  for (const duel of match.duels) {
    const attacking = duel.attacking_club_id === clubId;
    const player = attacking ? duel.attacker : duel.defender;
    items.set(player.player_id, player);
  }
  return [...items.values()].sort(
    (a, b) =>
      positionOrder[a.position] - positionOrder[b.position] ||
      a.player_name.localeCompare(b.player_name, "pt-BR"),
  );
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
function fieldValue(player: FieldPlayer, duels: MatchDetail["duels"]) {
  const attack = duels.find(
    (duel) => duel.attacker.player_id === player.player_id,
  );
  if (attack)
    return `${attributeLabel(attack.attacker.attribute).slice(0, 3)} ${attack.attacker.value}`;
  const defense = duels.find(
    (duel) => duel.defender.player_id === player.player_id,
  );
  return defense ? `Def ${defense.defender.value}` : "—";
}
function attributeLabel(attribute: MatchDuelPlayer["attribute"]) {
  return {
    shooting: "Finalização",
    passing: "Passe",
    dribbling: "Drible",
    defending: "Defesa",
  }[attribute];
}
function resultLabel(match: MatchDetail) {
  if (match.result === "EMPATE") return "Empate";
  return match.result === "MANDANTE"
    ? "Vitória do mandante"
    : "Vitória do visitante";
}
