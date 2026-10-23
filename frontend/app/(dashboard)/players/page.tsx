"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  CirclePlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  X,
  ChevronRight,
} from "lucide-react";

import {
  BuyPlayerDialog,
  ConditionDialog,
  EditPlayerDialog,
  PlayerCreatedDialog,
  PlayerCreateDialog,
  PlayerDetailsDialog,
} from "@/components/players/player-dialogs";
import { PlayerRow } from "@/components/players/player-row";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError, query } from "@/lib/api";
import type { Club, Player, PlayerList } from "@/lib/types";

type Filters = {
  search: string;
  position: string;
  condition: string;
  club_id: string;
  age: string;
  value: string;
  tab: "all" | "free" | "club";
  sort: string;
  page: number;
};
type Modal =
  | "create"
  | "created"
  | "buy"
  | "condition"
  | "delete"
  | "detail"
  | "edit"
  | null;
const initialFilters: Filters = {
  search: "",
  position: "",
  condition: "",
  club_id: "",
  age: "",
  value: "",
  tab: "all",
  sort: "name",
  page: 1,
};

export default function PlayersPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [players, setPlayers] = useState<PlayerList | null>(null);
  const [counts, setCounts] = useState({ all: 0, free: 0, club: 0 });
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<
    { title: string; description?: string } | string | null
  >(null);
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Player | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = query({
        search: filters.search,
        position: filters.position,
        condition: filters.condition,
        club_id: filters.tab === "free" ? undefined : filters.club_id,
        free:
          filters.tab === "free"
            ? true
            : filters.tab === "club"
              ? false
              : undefined,
        sort: filters.sort,
        page: filters.page,
        limit: 7,
        min_age: filters.age.split("-")[0],
        max_age: filters.age.split("-")[1],
        min_value: filters.value.split("-")[0],
        max_value: filters.value.split("-")[1],
      });
      const [result, all, free, club] = await Promise.all([
        api<PlayerList>(`/players${params}`),
        api<PlayerList>("/players?limit=1"),
        api<PlayerList>("/players?limit=1&free=true"),
        api<PlayerList>("/players?limit=1&free=false"),
      ]);
      setPlayers(result);
      setCounts({
        all: all.meta.total_items,
        free: free.meta.total_items,
        club: club.meta.total_items,
      });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar os jogadores.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    api<Club[]>("/clubs")
      .then(setClubs)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setFilter = (patch: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  const clubById = useMemo(
    () => new Map(clubs.map((club) => [club.id, club])),
    [clubs],
  );
  const open = (kind: Exclude<Modal, null>, player?: Player) => {
    setSelected(player ?? null);
    setModal(kind);
  };
  const onSuccess = (title: string, description?: string) => {
    setModal(null);
    setSelected(null);
    setToast({ title, description });
    void load();
  };
  const toastContent = typeof toast === "string" ? { title: toast } : toast;
  const removePlayer = async (player: Player) => {
    try {
      await api<void>(`/players/${player.id}`, { method: "DELETE" });
      onSuccess("Jogador excluído", `${player.name} foi removido da liga.`);
    } catch (cause) {
      setModal(null);
      setSelected(null);
      setToast(
        cause instanceof ApiError ? cause.message : "Não foi possível excluir.",
      );
    }
  };

  return (
    <section className="screen">
      <div className="app-topbar">
        <span>▣</span>
        <i />
        <span>Mercado</span>
        <ChevronRight size={14} />
        <b>Jogadores</b>
        <button onClick={() => void load()} aria-label="Atualizar">
          <RefreshCw size={17} />
        </button>
      </div>
      <header className="screen-header">
        <div className="screen-title">
          <span className="title-icon">
            <UsersRound />
          </span>
          <div>
            <h1>Jogadores</h1>
            <p>
              Cadastre jogadores, acompanhe os indicadores e compre os que estão
              livres.
            </p>
          </div>
        </div>
        <Button onClick={() => open("create")}>
          <Plus size={17} />
          Novo jogador
        </Button>
      </header>
      <div className="filters card">
        <label className="search-field">
          <Search size={18} />
          <Input
            value={filters.search}
            onChange={(event) => setFilter({ search: event.target.value })}
            placeholder="Buscar por nome"
          />
        </label>
        <FilterSelect
          label="Posição"
          value={filters.position}
          onChange={(position) => setFilter({ position })}
          options={["GOL", "ZAG", "LAT", "MEI", "ATA"]}
        />
        <FilterSelect
          label="Condição"
          value={filters.condition}
          onChange={(condition) => setFilter({ condition })}
          options={["APTO", "MAL_CONDICIONADO", "DOENTE"]}
        />
        <FilterSelect
          label="Clube"
          value={filters.club_id}
          onChange={(club_id) =>
            setFilter({ club_id, tab: club_id ? "all" : filters.tab })
          }
          options={clubs.map((club) => `${club.id}:${club.name}`)}
          disabled={filters.tab === "free"}
        />
        <FilterSelect
          label="Idade"
          value={filters.age}
          onChange={(age) => setFilter({ age })}
          options={["16-20", "21-25", "26-30", "31-45"]}
        />
        <FilterSelect
          label="Valor de mercado"
          value={filters.value}
          onChange={(value) => setFilter({ value })}
          options={["0-30", "30-50", "50-550"]}
        />
      </div>
      <div className="players-card card">
        <div className="player-controls">
          <div className="tabs">
            <button
              className={filters.tab === "all" ? "active" : ""}
              onClick={() => setFilter({ tab: "all" })}
            >
              Todos <span>{counts.all}</span>
            </button>
            <button
              className={filters.tab === "free" ? "active" : ""}
              onClick={() => setFilter({ tab: "free" })}
            >
              Livres <span>{counts.free}</span>
            </button>
            <button
              className={filters.tab === "club" ? "active" : ""}
              onClick={() => setFilter({ tab: "club" })}
            >
              Em clubes <span>{counts.club}</span>
            </button>
          </div>
          <Select
            value={filters.sort}
            onValueChange={(sort) => setFilter({ sort })}
          >
            <SelectTrigger className="sort" aria-label="Ordenar jogadores">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">↕ Ordenar: nome</SelectItem>
              <SelectItem value="value_desc">
                ↕ Maior valor de mercado
              </SelectItem>
              <SelectItem value="value_asc">
                ↕ Menor valor de mercado
              </SelectItem>
              <SelectItem value="age_asc">↕ Menor idade</SelectItem>
              <SelectItem value="age_desc">↕ Maior idade</SelectItem>
              <SelectItem value="position">↕ Posição</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="table-state">Carregando jogadores...</div>
        ) : error ? (
          <div className="table-state error-state">
            {error}
            <Button variant="outline" onClick={() => void load()}>
              Tentar novamente
            </Button>
          </div>
        ) : players?.data.length ? (
          <div className="table-wrap">
            <table className="players-table">
              <thead>
                <tr>
                  <th>Jogador</th>
                  <th>Posição</th>
                  <th>Overall</th>
                  <th>Agilidade</th>
                  <th>Idade</th>
                  <th>Condição</th>
                  <th>Valor base</th>
                  <th>Valor de mercado</th>
                  <th>Clube</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {players.data.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    club={
                      player.club_id ? clubById.get(player.club_id) : undefined
                    }
                    onDetail={() => open("detail", player)}
                    onEdit={() => open("edit", player)}
                    onBuy={() => open("buy", player)}
                    onCondition={() => open("condition", player)}
                    onDelete={() => open("delete", player)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-state">
            Nenhum jogador encontrado com estes filtros.
          </div>
        )}
        <Pagination
          meta={players?.meta}
          onPage={(page) => setFilter({ page })}
        />
      </div>
      <p className="screen-note">
        Overall e valor de mercado são calculados a cada consulta. A busca
        ignora maiúsculas, minúsculas e acentos.
      </p>
      {modal === "create" && (
        <PlayerCreateDialog
          onClose={() => setModal(null)}
          onCreated={(player) => {
            setSelected(player);
            setModal("created");
            void load();
          }}
        />
      )}
      {modal === "created" && selected && (
        <PlayerCreatedDialog
          player={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          onViewDetails={() => setModal("detail")}
        />
      )}
      {modal === "buy" && selected && (
        <BuyPlayerDialog
          player={selected}
          clubs={clubs}
          onClose={() => setModal(null)}
          onCompleted={() => void load()}
        />
      )}
      {modal === "condition" && selected && (
        <ConditionDialog
          player={selected}
          club={selected.club_id ? clubById.get(selected.club_id) : undefined}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
      {modal === "detail" && selected && (
        <PlayerDetailsDialog
          player={selected}
          club={selected.club_id ? clubById.get(selected.club_id) : undefined}
          onClose={() => setModal(null)}
          onEdit={() => setModal("edit")}
          onCondition={() => setModal("condition")}
          onBuy={() => setModal("buy")}
        />
      )}
      {modal === "delete" && selected && (
        <ConfirmDialog
          title={`Excluir ${selected.name}?`}
          description="O jogador sai da liga e da busca, mas as transações e as partidas antigas dele continuam como foram registradas."
          confirmLabel="Excluir jogador"
          confirmIcon={<Trash2 size={14} />}
          variant="destructive"
          onClose={() => setModal(null)}
          onConfirm={() => removePlayer(selected)}
        >
          <div className="confirm-player">
            <span className={`avatar avatar-${selected.id % 4}`}>
              {selected.name
                .split(" ")
                .slice(0, 2)
                .map((name) => name[0])
                .join("")}
            </span>
            <span>
              <b>{selected.name}</b>
              <small>
                {selected.position} · {selected.age} anos
              </small>
            </span>
            <em>{selected.club_id ? "Em clube" : "Livre"}</em>
          </div>
        </ConfirmDialog>
      )}
      {modal === "edit" && selected && (
        <EditPlayerDialog
          player={selected}
          onClose={() => setModal(null)}
          onSuccess={onSuccess}
        />
      )}
      {toastContent && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          <span>
            <b>{toastContent.title}</b>
            {toastContent.description && (
              <small>{toastContent.description}</small>
            )}
          </span>
          <button onClick={() => setToast(null)} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value || "__all__"}
      onValueChange={(next) => onChange(next === "__all__" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{label}</SelectItem>
        {options.map((option) => {
          const [id, text] = option.split(":");
          return (
            <SelectItem key={option} value={text ? id : option}>
              {text ?? option.replaceAll("_", " ")}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function Pagination({
  meta,
  onPage,
}: {
  meta?: PlayerList["meta"];
  onPage: (page: number) => void;
}) {
  if (!meta) return null;
  return (
    <footer className="pagination">
      <span>
        Mostrando {(meta.page - 1) * meta.limit + (meta.total_items ? 1 : 0)}–
        {Math.min(meta.page * meta.limit, meta.total_items)} de{" "}
        {meta.total_items} jogadores
      </span>
      <div>
        <button
          disabled={meta.page === 1}
          onClick={() => onPage(meta.page - 1)}
        >
          ‹ Anterior
        </button>
        {Array.from({ length: meta.total_pages }, (_, index) => index + 1)
          .slice(Math.max(0, meta.page - 2), meta.page + 2)
          .map((page) => (
            <button
              key={page}
              className={page === meta.page ? "current" : ""}
              onClick={() => onPage(page)}
            >
              {page}
            </button>
          ))}
        <button
          disabled={meta.page === meta.total_pages}
          onClick={() => onPage(meta.page + 1)}
        >
          Próxima ›
        </button>
      </div>
    </footer>
  );
}
