"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  LayoutList,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { dateTimeBr } from "@/lib/utils";
import type { Club, Match, Standing } from "@/lib/types";

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [table, results, leagueClubs] = await Promise.all([
        api<Standing[]>("/standings"),
        api<Match[]>("/matches"),
        api<Club[]>("/clubs"),
      ]);
      setStandings(table);
      setMatches(results);
      setClubs(leagueClubs);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar a classificação.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const acronymByClub = useMemo(
    () => new Map(clubs.map((club) => [club.id, club.acronym])),
    [clubs],
  );

  return (
    <section className="screen standings-screen">
      <div className="app-topbar">
        <span>▣</span>
        <i />
        <span>Liga</span>
        <ChevronRight size={14} />
        <b>Classificação</b>
        <button
          onClick={() => void load()}
          aria-label="Atualizar classificação"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <header className="screen-header standings-header">
        <div className="screen-title">
          <span className="title-icon">
            <LayoutList />
          </span>
          <div>
            <h1>Classificação</h1>
            <p>Todos jogam. 3 pontos por vitória e 1 por empate.</p>
          </div>
        </div>
        <Link
          href="/matches"
          className="ui-button ui-button-outline standings-new-match"
        >
          <Plus size={16} /> Nova partida
        </Link>
      </header>

      {loading ? (
        <div className="table-state standings-state">
          Carregando classificação...
        </div>
      ) : error ? (
        <div className="table-state error-state standings-state">
          {error}
          <Button variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="standings-layout">
          <section className="standings-table-card card">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Clube</th>
                  <th>J</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>GP</th>
                  <th>GC</th>
                  <th>SG</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.club_id}>
                    <td>
                      <span
                        className={
                          row.position === 1
                            ? "standing-position leader"
                            : "standing-position"
                        }
                      >
                        {row.position}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/clubs/${row.club_id}`}
                        className="standing-club"
                      >
                        <i>
                          {acronymByClub.get(row.club_id) ??
                            row.club_name.slice(0, 3).toUpperCase()}
                        </i>
                        <b>{row.club_name}</b>
                      </Link>
                    </td>
                    <td>{row.played}</td>
                    <td>{row.wins}</td>
                    <td>{row.draws}</td>
                    <td>{row.losses}</td>
                    <td>{row.goals_for}</td>
                    <td>{row.goals_against}</td>
                    <td>{signed(row.goal_difference)}</td>
                    <td>
                      <strong>{row.points}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <footer className="standings-legend">
              J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols
              marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos
            </footer>
          </section>

          <aside className="standings-side">
            <section className="card recent-matches-card">
              <header>
                <h2>Últimas partidas</h2>
                <p>Da mais recente para a mais antiga.</p>
              </header>
              {matches.slice(0, 2).map((match) => (
                <article key={match.id}>
                  <small>{dateTimeBr(match.played_at)}</small>
                  <p>
                    <b>{match.home.club_name}</b>
                    <strong>
                      {match.home.goals} × {match.away.goals}
                    </strong>
                    <b>{match.away.club_name}</b>
                  </p>
                </article>
              ))}
              {!matches.length && (
                <p className="recent-empty">Nenhuma partida jogada ainda.</p>
              )}
              <Link href="/matches">
                Ver todas as partidas <ChevronRight size={13} />
              </Link>
            </section>
            <section className="card standings-order-card">
              <header>
                <ClipboardList size={14} />
                <div>
                  <h2>Ordem da tabela</h2>
                  <p>Critérios de classificação, nesta ordem.</p>
                </div>
              </header>
              <ol>
                <li>Mais pontos</li>
                <li>Maior saldo de gols</li>
                <li>Mais gols marcados</li>
                <li>Nome do clube, de A a Z</li>
              </ol>
            </section>
          </aside>
        </div>
      )}
      <p className="screen-note standings-note">
        Classificação de 1 a {standings.length}, com os clubes sem partidas
        zerados. Pontos, saldo e posição são calculados a cada consulta, nunca
        gravados.
      </p>
    </section>
  );
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
