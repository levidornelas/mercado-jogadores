"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Goal, Plus, RefreshCw, Swords } from "lucide-react";

import { MatchCreateDialog } from "@/components/matches/match-create-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { dateTimeBr } from "@/lib/utils";
import type { Club, Match } from "@/lib/types";

export default function MatchesPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [clubFilter, setClubFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leagueClubs, history] = await Promise.all([
        api<Club[]>("/clubs"),
        api<Match[]>("/matches"),
      ]);
      setClubs(leagueClubs);
      setMatches(history);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar as partidas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredMatches = useMemo(
    () =>
      clubFilter === "all"
        ? matches
        : matches.filter(
            (match) =>
              match.home.club_id === Number(clubFilter) ||
              match.away.club_id === Number(clubFilter),
          ),
    [clubFilter, matches],
  );
  const acronymByClub = useMemo(
    () => new Map(clubs.map((club) => [club.id, club.acronym])),
    [clubs],
  );
  const latest = matches[0];

  return (
    <section className="screen matches-screen">
      <div className="app-topbar">
        <span>▣</span>
        <i />
        <span>Liga</span>
        <ChevronRight size={14} />
        <b>Partidas</b>
        <button onClick={() => void load()} aria-label="Atualizar partidas">
          <RefreshCw size={17} />
        </button>
      </div>
      <header className="screen-header matches-header">
        <div className="screen-title">
          <span className="title-icon">
            <Goal />
          </span>
          <div>
            <h1>Partidas</h1>
            <p>
              Jogue partidas entre clubes com os 5 titulares escalados e
              acompanhe o histórico.
            </p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={17} /> Nova partida
        </Button>
      </header>

      {loading ? (
        <div className="table-state matches-state">Carregando partidas...</div>
      ) : error ? (
        <div className="table-state error-state matches-state">
          {error}
          <Button variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <section className="latest-match">
            <header>Última partida</header>
            {latest ? (
              <LatestMatch match={latest} acronymByClub={acronymByClub} />
            ) : (
              <div className="latest-match-empty">
                <Goal aria-hidden="true" />
                <p>Nenhuma partida jogada ainda.</p>
                <Button onClick={() => setCreating(true)}>
                  <Swords size={15} /> Jogar a primeira
                </Button>
              </div>
            )}
          </section>

          <section className="matches-history card">
            <header>
              <div>
                <h2>Histórico de partidas</h2>
                <p>Da mais recente para a mais antiga.</p>
              </div>
              <Select value={clubFilter} onValueChange={setClubFilter}>
                <SelectTrigger className="matches-club-filter">
                  <SelectValue placeholder="Clube: todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Clube: todos</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem value={String(club.id)} key={club.id}>
                      {club.name} ({club.acronym})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </header>
            {filteredMatches.length ? (
              <div className="table-wrap">
                <table className="matches-table">
                  <thead>
                    <tr>
                      <th>Data e hora</th>
                      <th>Mandante</th>
                      <th>Placar</th>
                      <th>Visitante</th>
                      <th>Resultado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatches.map((match) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        acronymByClub={acronymByClub}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="matches-empty">
                Nenhuma partida encontrada para este clube.
              </div>
            )}
          </section>
          <p className="screen-note matches-note">
            {filteredMatches.length}{" "}
            {filteredMatches.length === 1 ? "partida" : "partidas"}. Partidas da
            mais recente para a mais antiga, com filtro por clube. “Ver duelos”
            abre a partida.
          </p>
        </>
      )}
      {creating && (
        <MatchCreateDialog
          clubs={clubs}
          onClose={() => setCreating(false)}
          onPlayed={(match) => {
            setCreating(false);
            setToast(
              `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`,
            );
            void load();
          }}
        />
      )}
      {toast && (
        <div className="toast matches-toast" role="status">
          <Swords size={16} />
          <span>
            <b>Partida concluída</b>
            <small>{toast}</small>
          </span>
          <button onClick={() => setToast(null)} aria-label="Fechar">
            ×
          </button>
        </div>
      )}
    </section>
  );
}

function LatestMatch({
  match,
  acronymByClub,
}: {
  match: Match;
  acronymByClub: Map<number, string>;
}) {
  return (
    <div className="latest-match-body">
      <Team
        club={match.home}
        acronym={acronymByClub.get(match.home.club_id)}
        align="right"
      />
      <div className="latest-score">
        <strong>
          {match.home.goals} × {match.away.goals}
        </strong>
        <small>{dateTimeBr(match.played_at)}</small>
        <span>{resultLabel(match)}</span>
      </div>
      <Team
        club={match.away}
        acronym={acronymByClub.get(match.away.club_id)}
      />
      <Button variant="outline" disabled>
        Ver duelos <ChevronRight size={14} />
      </Button>
    </div>
  );
}

function MatchRow({
  match,
  acronymByClub,
}: {
  match: Match;
  acronymByClub: Map<number, string>;
}) {
  return (
    <tr>
      <td>{dateTimeBr(match.played_at)}</td>
      <td>
        <Team
          club={match.home}
          acronym={acronymByClub.get(match.home.club_id)}
          compact
        />
      </td>
      <td>
        <span className="match-score">
          {match.home.goals} × {match.away.goals}
        </span>
      </td>
      <td>
        <Team
          club={match.away}
          acronym={acronymByClub.get(match.away.club_id)}
          compact
        />
      </td>
      <td>
        <span className="match-result">{resultLabel(match)}</span>
      </td>
      <td>
        <Button variant="ghost" disabled>
          Ver duelos <ChevronRight size={13} />
        </Button>
      </td>
    </tr>
  );
}

function Team({
  club,
  acronym,
  align,
  compact = false,
}: {
  club: Match["home"];
  acronym?: string;
  align?: "right";
  compact?: boolean;
}) {
  return (
    <span
      className={`match-team ${align === "right" ? "right" : ""} ${compact ? "compact" : ""}`}
    >
      <i>{acronym ?? club.club_name.slice(0, 3).toUpperCase()}</i>
      <span>
        <b>{club.club_name}</b>
        {!compact && (
          <small>{align === "right" ? "Mandante" : "Visitante"}</small>
        )}
      </span>
    </span>
  );
}

function resultLabel(match: Match) {
  if (match.result === "EMPATE") return "Empate";
  return match.result === "MANDANTE"
    ? "Vitória do mandante"
    : "Vitória do visitante";
}
