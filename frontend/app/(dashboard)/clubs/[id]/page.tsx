"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Handshake,
  History,
  LayoutList,
  Pencil,
  RefreshCw,
  Shield,
  ShoppingCart,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import formation31 from "../../../../assets/Formação=3-1.svg";
import formation22 from "../../../../assets/Formação=2-2.svg";
import formation211 from "../../../../assets/Formação=2-1-1.svg";
import formation121 from "../../../../assets/Formação=1-2-1.svg";
import { SellPlayerDialog } from "@/components/players/player-dialogs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { dateTimeBr, money } from "@/lib/utils";
import type { ClubDetail, Lineup, Player, TransactionList } from "@/lib/types";

type Tab = "squad" | "lineup" | "history";
type Formation = "3-1" | "2-2" | "2-1-1" | "1-2-1";
type Slot = "GOL" | "DEF" | "MEI" | "ATA";

const formations: {
  id: Formation;
  label: string;
  hint: string;
  image: StaticImageData;
  slots: Slot[];
  coordinates: { left: number; top: number }[];
}[] = [
  {
    id: "3-1",
    label: "3-1",
    hint: "Defensiva: 3 def., ataque 1",
    image: formation31,
    slots: ["GOL", "DEF", "DEF", "DEF", "ATA"],
    coordinates: [
      { left: 50, top: 87.5 },
      { left: 22.5, top: 70.2 },
      { left: 50, top: 70.2 },
      { left: 77.5, top: 70.2 },
      { left: 50, top: 15.4 },
    ],
  },
  {
    id: "2-2",
    label: "2-2",
    hint: "Ofensiva: 2 def., ataque 2",
    image: formation22,
    slots: ["GOL", "DEF", "DEF", "ATA", "ATA"],
    coordinates: [
      { left: 50, top: 87.5 },
      { left: 32.5, top: 70.2 },
      { left: 67.5, top: 70.2 },
      { left: 32.5, top: 15.4 },
      { left: 67.5, top: 15.4 },
    ],
  },
  {
    id: "2-1-1",
    label: "2-1-1",
    hint: "Equilibrada: 2 def., meio 1, ataque 1",
    image: formation211,
    slots: ["GOL", "DEF", "DEF", "MEI", "ATA"],
    coordinates: [
      { left: 50, top: 87.5 },
      { left: 32.5, top: 70.2 },
      { left: 67.5, top: 70.2 },
      { left: 50, top: 51.9 },
      { left: 50, top: 15.4 },
    ],
  },
  {
    id: "1-2-1",
    label: "1-2-1",
    hint: "Ofensiva: 1 def., meio 2, ataque 1",
    image: formation121,
    slots: ["GOL", "DEF", "MEI", "MEI", "ATA"],
    coordinates: [
      { left: 50, top: 87.5 },
      { left: 50, top: 70.2 },
      { left: 32.5, top: 51.9 },
      { left: 67.5, top: 51.9 },
      { left: 50, top: 15.4 },
    ],
  },
];
const slotLabel: Record<Slot, string> = {
  GOL: "Goleiro",
  DEF: "Defesa",
  MEI: "Meio",
  ATA: "Ataque",
};

export default function ClubDetailPage() {
  const params = useParams<{ id: string }>();
  const clubId = Number(params.id);
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [transactions, setTransactions] = useState<TransactionList | null>(
    null,
  );
  const [tab, setTab] = useState<Tab>("squad");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellPlayer, setSellPlayer] = useState<Player | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(clubId) || clubId < 1) return;
    setLoading(true);
    setError(null);
    try {
      const [clubData, lineupData, historyData] = await Promise.all([
        api<ClubDetail>(`/clubs/${clubId}`),
        api<Lineup>(`/clubs/${clubId}/lineup`),
        api<TransactionList>(`/clubs/${clubId}/transactions`),
      ]);
      setClub(clubData);
      setLineup(lineupData);
      setTransactions(historyData);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar o clube.",
      );
    } finally {
      setLoading(false);
    }
  }, [clubId]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const selectedIds = useMemo(
    () => new Set(lineup?.players.map((player) => player.id) ?? []),
    [lineup],
  );
  if (loading)
    return (
      <section className="screen">
        <div className="table-state">Carregando clube...</div>
      </section>
    );
  if (error || !club)
    return (
      <section className="screen">
        <div className="table-state error-state">
          {error ?? "Clube não encontrado."}
          <Button variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );

  return (
    <section className="screen club-detail-screen">
      <div className="app-topbar">
        <span>▣</span>
        <i />
        <span>Mercado</span>
        <ChevronRight size={14} />
        <span>Clubes</span>
        <ChevronRight size={14} />
        <b>{club.name}</b>
        <button onClick={() => void load()} aria-label="Atualizar">
          <RefreshCw size={17} />
        </button>
      </div>
      <header className="club-page-header">
        <div className="club-heading-title">
          <span className="club-crest">{club.acronym}</span>
          <div>
            <h1>{club.name}</h1>
            <p>
              Sigla {club.acronym} <span>◷</span> {club.players.length} de 12
              jogadores
            </p>
          </div>
        </div>
        <Link href="/players">
          <Button>
            <ShoppingCart size={16} />
            Comprar jogadores
          </Button>
        </Link>
      </header>
      <div className="club-kpis">
        <Kpi
          label="Caixa"
          value={money(club.cash)}
          hint="Só muda por compras e vendas"
          icon={<BarChart3 size={14} />}
        />
        <Kpi
          label="Valor do elenco"
          value={money(club.squad_value)}
          hint="Soma dos valores de mercado"
          icon={<UsersRound size={14} />}
        />
        <Kpi
          label="Patrimônio"
          value={money(club.net_worth)}
          hint="Caixa + valor do elenco"
          icon={<Shield size={14} />}
        />
        <Kpi
          label="Elenco"
          value={`${club.players.length} de 12`}
          hint="Limite de 12 jogadores"
          icon={<UsersRound size={14} />}
        />
      </div>
      <nav className="club-tabs">
        <button
          className={tab === "squad" ? "active" : ""}
          onClick={() => setTab("squad")}
        >
          <UsersRound size={14} />
          Elenco <span>{club.players.length}</span>
        </button>
        <button
          className={tab === "lineup" ? "active" : ""}
          onClick={() => setTab("lineup")}
        >
          <LayoutList size={14} />
          Escalação
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          <History size={14} />
          Histórico <span>{transactions?.data.length ?? 0}</span>
        </button>
      </nav>
      {tab === "squad" && (
        <SquadTab players={club.players} onSell={setSellPlayer} />
      )}
      {tab === "lineup" && (
        <LineupTab
          club={club}
          lineup={lineup}
          onSaved={(newLineup) => {
            setLineup(newLineup);
            setToast("Escalação salva com sucesso.");
          }}
        />
      )}
      {tab === "history" && (
        <HistoryTab clubId={club.id} history={transactions} />
      )}
      {sellPlayer && (
        <SellPlayerDialog
          player={sellPlayer}
          club={club}
          isStarter={selectedIds.has(sellPlayer.id)}
          onClose={() => setSellPlayer(null)}
          onCompleted={() => void load()}
          onViewHistory={() => {
            setSellPlayer(null);
            setTab("history");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          <span>
            <b>Clube atualizado</b>
            <small>{toast}</small>
          </span>
          <button onClick={() => setToast(null)} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <article className="club-kpi">
      <span>
        {label}
        {icon}
      </span>
      <b>
        {value} <small>{label === "Elenco" ? "" : "moedas"}</small>
      </b>
      <p>{hint}</p>
    </article>
  );
}
function initials(player: Player) {
  return player.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function SquadTab({
  players,
  onSell,
}: {
  players: Player[];
  onSell: (player: Player) => void;
}) {
  return (
    <section className="club-tab-card card">
      <header className="club-tab-title">
        <div>
          <h2>Elenco</h2>
          <p>
            Ordenado por posição: GOL, ZAG, LAT, MEI, ATA; depois pelo nome.
            Contrato calculado para uma venda agora.
          </p>
        </div>
      </header>
      <div className="table-wrap">
        <table className="club-squad-table">
          <thead>
            <tr>
              <th>Jogador</th>
              <th>Posição</th>
              <th>Overall</th>
              <th>Condição</th>
              <th>Valor de mercado</th>
              <th>Fim da fidelidade</th>
              <th>Dias restantes</th>
              <th>% de multa</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id}>
                <td>
                  <span className="player-name">
                    <span className={`avatar avatar-${player.id % 4}`}>
                      {initials(player)}
                    </span>
                    <b>{player.name}</b>
                  </span>
                </td>
                <td>
                  <span className="position-chip">{player.position}</span>
                </td>
                <td>
                  <b>{player.overall}</b>
                </td>
                <td>
                  <span
                    className={`condition ${player.condition.toLowerCase()}`}
                  >
                    ●{" "}
                    {player.condition === "APTO"
                      ? "Apto"
                      : player.condition === "DOENTE"
                        ? "Doente"
                        : "Mal condicionado"}
                  </span>
                </td>
                <td>{money(player.market_value)}</td>
                <td>{player.contract?.loyalty_until ?? "—"}</td>
                <td>
                  {player.contract
                    ? `${player.contract.remaining_days} d`
                    : "—"}
                </td>
                <td>
                  {player.contract ? `${player.contract.penalty_rate}%` : "—"}
                </td>
                <td>
                  <Button variant="outline" onClick={() => onSell(player)}>
                    Vender
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!players.length && (
        <div className="empty-club-state">
          Este clube ainda não possui jogadores. Compre jogadores livres para
          montar o elenco.
        </div>
      )}
    </section>
  );
}

function LineupTab({
  club,
  lineup,
  onSaved,
}: {
  club: ClubDetail;
  lineup: Lineup | null;
  onSaved: (lineup: Lineup) => void;
}) {
  const initialFormation = lineup?.formation ?? "2-1-1";
  const [formation, setFormation] = useState<Formation>(
    initialFormation as Formation,
  );
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (lineup?.formation === formation && lineup.players.length) {
      setChosen(
        Object.fromEntries(
          lineup.players.map((player, index) => [index, String(player.id)]),
        ),
      );
    }
  }, [formation, lineup]);
  const current =
    formations.find((item) => item.id === formation) ?? formations[2];
  const options = (slot: Slot) =>
    club.players.filter(
      (player) =>
        player.condition !== "DOENTE" &&
        (slot === "DEF"
          ? player.position === "ZAG" || player.position === "LAT"
          : player.position === slot),
    );
  const save = async () => {
    const ids = current.slots.map((_, index) => Number(chosen[index]));
    if (ids.some(Number.isNaN) || new Set(ids).size !== 5) {
      setError("Escolha cinco jogadores diferentes para salvar a escalação.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await api<Lineup>(`/clubs/${club.id}/lineup`, {
          method: "PUT",
          body: JSON.stringify({ formation, player_ids: ids }),
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível salvar a escalação.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="lineup-layout">
      <div className="club-tab-card card lineup-editor">
        <header className="club-tab-title">
          <div>
            <h2>Titulares</h2>
            <p>
              Escolha 5 jogadores do elenco, na formação escolhida. Salve para
              usar nas partidas.
            </p>
          </div>
          <span
            className={
              lineup?.complete ? "lineup-status complete" : "lineup-status"
            }
          >
            {lineup?.complete ? "● Completa" : "◌ Incompleta"}
          </span>
        </header>
        {error && <div className="club-form-alert">{error}</div>}
        <h3>Formação</h3>
        <p className="formation-copy">
          Os números contam os jogadores de linha da sua formação. O goleiro
          fica fora da conta.
        </p>
        <div className="formation-options">
          {formations.map((item) => (
            <button
              type="button"
              key={item.id}
              className={formation === item.id ? "selected" : ""}
              onClick={() => {
                setFormation(item.id);
                setChosen({});
              }}
            >
              <Image src={item.image} alt="" />
              <span>
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="lineup-slots">
          <header>
            <span>Vaga</span>
            <span>Titular</span>
            <span>Condição</span>
            <span>Overall</span>
          </header>
          {current.slots.map((slot, index) => {
            const player = club.players.find(
              (item) => item.id === Number(chosen[index]),
            );
            return (
              <div key={`${formation}-${index}`}>
                <span>
                  {slotLabel[slot]}
                  <small>{slot === "DEF" ? "ZAG ou LAT" : slot}</small>
                </span>
                <Select
                  value={chosen[index] || undefined}
                  onValueChange={(value) =>
                    setChosen((old) => ({ ...old, [index]: value }))
                  }
                >
                  <SelectTrigger aria-label={`Selecionar ${slotLabel[slot]}`}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                  {options(slot).map((option) => (
                    <SelectItem
                      key={option.id}
                      value={String(option.id)}
                      disabled={Object.entries(chosen).some(
                        ([key, value]) =>
                          Number(key) !== index && Number(value) === option.id,
                      )}
                    >
                      {option.name} ({option.position})
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
                <span
                  className={
                    player ? `condition ${player.condition.toLowerCase()}` : ""
                  }
                >
                  {player
                    ? `● ${player.condition === "APTO" ? "Apto" : "Mal condicionado"}`
                    : "—"}
                </span>
                <b>{player?.overall ?? "—"}</b>
              </div>
            );
          })}
        </div>
        <footer className="lineup-actions">
          <Button variant="outline" onClick={() => setChosen({})}>
            Cancelar
          </Button>
          <Button disabled={saving} onClick={save}>
            {saving ? "Salvando..." : "Salvar escalação"}
          </Button>
        </footer>
      </div>
      <FieldPreview
        formation={current}
        players={current.slots.map((_, index) =>
          club.players.find((player) => player.id === Number(chosen[index])),
        )}
      />
    </section>
  );
}

function FieldPreview({
  formation,
  players,
}: {
  formation: (typeof formations)[number];
  players: Array<Player | undefined>;
}) {
  return (
    <aside className="field-preview card">
      <h3>Em campo</h3>
      <p>Prévia da formação {formation.label}; os jogadores se ajustam.</p>
      <div
        className="football-field"
        style={{ backgroundImage: `url(${formation.image.src})` }}
      >
        <svg
          className="field-marker-layer"
          viewBox="0 0 40 52"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {players.map((player, index) => {
            if (!player) return null;
            const coordinate = formation.coordinates[index];
            const x = coordinate.left * 0.4;
            const y = coordinate.top * 0.52;
            return (
              <g key={player.id}>
                <circle cx={x} cy={y} r="3.1" className="field-marker" />
                <text x={x} y={y + 0.7} className="field-marker-initials">
                  {initials(player)}
                </text>
                {player.condition === "MAL_CONDICIONADO" && (
                  <>
                    <circle
                      cx={x - 2.4}
                      cy={y - 2.4}
                      r="1.25"
                      className="field-marker-condition"
                    />
                    <text
                      x={x - 2.4}
                      y={y - 2.05}
                      className="field-marker-condition-icon"
                    >
                      ♥
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
        {players.map((player, index) => {
          if (!player) return null;
          const coordinate = formation.coordinates[index];
          const alignedTop = 4.545 + coordinate.top * 0.9091;
          return (
            <span
              key={player.id}
              className="field-player"
              style={{ left: `${coordinate.left}%`, top: `${alignedTop}%` }}
            >
              <b>{player.name.split(" ")[0]}</b>
            </span>
          );
        })}
      </div>
      <p className="field-note">
        Na partida, apenas os 5 jogadores de linha mais escalados do clube
        entram na simulação.
      </p>
    </aside>
  );
}

function HistoryTab({
  clubId,
  history,
}: {
  clubId: number;
  history: TransactionList | null;
}) {
  const data = history?.data ?? [];
  const [types, setTypes] = useState({ COMPRA: true, VENDA: true });
  const [playerId, setPlayerId] = useState("all");
  const players = useMemo(
    () =>
      Array.from(
        new Map(
          data.map((item) => [item.player_id, item.player_name]),
        ).entries(),
      ),
    [data],
  );
  const filteredData = data.filter(
    (item) =>
      types[item.type] &&
      (playerId === "all" || item.player_id === Number(playerId)),
  );
  const summary = filteredData.reduce(
    (total, item) => ({
      total_spent:
        total.total_spent +
        (item.type === "COMPRA" ? item.value + item.fee : 0),
      total_received:
        total.total_received + (item.type === "VENDA" ? item.cash_change : 0),
      total_fees: total.total_fees + item.fee,
      total_penalties:
        total.total_penalties + (item.type === "VENDA" ? item.penalty : 0),
      total_profit:
        total.total_profit + (item.type === "VENDA" ? (item.profit ?? 0) : 0),
    }),
    {
      total_spent: 0,
      total_received: 0,
      total_fees: 0,
      total_penalties: 0,
      total_profit: 0,
    },
  );
  const exportCsv = () => {
    const params = new URLSearchParams();
    const activeTypes = Object.entries(types)
      .filter(([, active]) => active)
      .map(([type]) => type);

    if (activeTypes.length && activeTypes.length < 2) {
      params.set("type", activeTypes.join(","));
    }
    if (playerId !== "all") {
      params.set("player_id", playerId);
    }

    const query = params.toString();
    const endpoint = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "")}/api/v1/clubs/${clubId}/transactions/export`;
    window.open(
      query ? `${endpoint}?${query}` : endpoint,
      "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <section className="club-tab-card card history-card">
      <header className="club-tab-title">
        <div>
          <h2>Histórico de transações</h2>
          <p>
            Da mais recente para a mais antiga, com o nome e os valores do
            momento de cada operação.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={!types.COMPRA && !types.VENDA}
        >
          <Download aria-hidden="true" /> Exportar CSV
        </Button>
      </header>
      <div className="history-filters">
        <span>Tipo</span>
        <Button
          variant="outline"
          className={types.COMPRA ? "history-filter-active" : ""}
          aria-pressed={types.COMPRA}
          onClick={() =>
            setTypes((current) => ({ ...current, COMPRA: !current.COMPRA }))
          }
        >
          <ShoppingCart aria-hidden="true" /> Compra
        </Button>
        <Button
          variant="outline"
          className={types.VENDA ? "history-filter-active" : ""}
          aria-pressed={types.VENDA}
          onClick={() =>
            setTypes((current) => ({ ...current, VENDA: !current.VENDA }))
          }
        >
          <Handshake aria-hidden="true" /> Venda
        </Button>
        <Select value={playerId} onValueChange={setPlayerId}>
          <SelectTrigger className="history-player-filter">
            <UserRound aria-hidden="true" />
            <SelectValue placeholder="Jogador: todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Jogador: todos</SelectItem>
            {players.map(([id, name]) => (
              <SelectItem key={id} value={String(id)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Data e hora</th>
              <th>Tipo</th>
              <th>Jogador</th>
              <th>Valor</th>
              <th>Taxa ou comissão</th>
              <th>Multa</th>
              <th>Lucro</th>
              <th>Variação do caixa</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{dateTimeBr(item.created_at)}</td>
                <td>
                  <span className={`history-type ${item.type.toLowerCase()}`}>
                    {item.type === "COMPRA" ? (
                      <>
                        <ShoppingCart aria-hidden="true" /> Compra
                      </>
                    ) : (
                      <>
                        <Handshake aria-hidden="true" /> Venda
                      </>
                    )}
                  </span>
                </td>
                <td>
                  <span className="history-player">
                    <i className={`avatar avatar-${item.player_id % 4}`}>
                      {item.player_name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </i>
                    <b>{item.player_name}</b>
                  </span>
                </td>
                <td>{money(item.value)}</td>
                <td>{money(item.fee)}</td>
                <td>{money(item.penalty)}</td>
                <td>{item.profit === null ? "—" : money(item.profit)}</td>
                <td className={item.cash_change >= 0 ? "positive" : "negative"}>
                  {item.cash_change >= 0 ? "+" : "−"}
                  {money(Math.abs(item.cash_change))}
                </td>
              </tr>
            ))}
            {!filteredData.length && (
              <tr>
                <td colSpan={8} className="history-empty">
                  Nenhuma transação encontrada com estes filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="history-summary">
        <Summary
          label="Total pago em compras"
          value={money(summary.total_spent)}
        />
        <Summary
          label="Total recebido em vendas"
          value={money(summary.total_received)}
        />
        <Summary label="Taxas e comissões" value={money(summary.total_fees)} />
        <Summary label="Multas" value={money(summary.total_penalties)} />
        <Summary label="Lucro total" value={money(summary.total_profit)} />
      </div>
    </section>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <b>{value}</b>
      <small>moedas</small>
    </div>
  );
}
