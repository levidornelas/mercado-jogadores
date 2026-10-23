"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Eye,
  HeartPulse,
  Handshake,
  Info,
  Pencil,
  RefreshCw,
  Shield,
  ShoppingCart,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";

import {
  conditionLabel,
  playerPositions,
  positionLabel,
} from "@/components/players/constants";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { money } from "@/lib/utils";
import type {
  Club,
  Player,
  PlayerCondition,
  PlayerPosition,
  Transaction,
} from "@/lib/types";

type Success = (title: string, description?: string) => void;
type NumericDraftValue = number | "";
type CreateDraft = {
  name: string;
  position: PlayerPosition | "";
  age: NumericDraftValue;
  agility: NumericDraftValue;
  pace: NumericDraftValue;
  shooting: NumericDraftValue;
  passing: NumericDraftValue;
  dribbling: NumericDraftValue;
  defending: NumericDraftValue;
  physical: NumericDraftValue;
  potential: NumericDraftValue;
};
const technicalFields = [
  ["pace", "Velocidade"],
  ["shooting", "Finalização"],
  ["passing", "Passe"],
  ["dribbling", "Drible"],
  ["defending", "Defesa"],
  ["physical", "Físico"],
] as const;

function FieldError({ message }: { message: string }) {
  return <small className="field-error">ⓘ {message}</small>;
}

export function PlayerCreateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (player: Player) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<CreateDraft>({
    name: "",
    position: "",
    age: "",
    agility: "",
    pace: "",
    shooting: "",
    passing: "",
    dribbling: "",
    defending: "",
    physical: "",
    potential: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateDraft, string>>
  >({});
  const setNumber = (
    field: Exclude<keyof CreateDraft, "name" | "position">,
    value: string,
  ) =>
    setDraft((current) => ({
      ...current,
      [field]: value === "" ? "" : Number(value),
    }));
  const validate = () => {
    const next: Partial<Record<keyof CreateDraft, string>> = {};
    const normalizedName = draft.name.trim().replace(/\s+/g, " ");
    const nameWords = normalizedName.split(" ").filter(Boolean);
    if (normalizedName.length < 3 || normalizedName.length > 100) {
      next.name = "Use de 3 a 100 caracteres.";
    } else if (
      nameWords.length < 2 ||
      nameWords.some((word) => !/\p{L}/u.test(word))
    ) {
      next.name = "Use pelo menos duas palavras com letras.";
    } else if (/\p{N}/u.test(normalizedName)) {
      next.name = "O nome não pode conter números.";
    }
    if (!draft.position) {
      next.position = "Escolha a posição.";
    }
    const age = Number(draft.age);
    const agility = Number(draft.agility);
    const potential = Number(draft.potential);
    if (age < 16 || age > 45) {
      next.age = "Use uma idade de 16 a 45 anos.";
    }
    if (agility < 1 || agility > 100) {
      next.agility = "Use um valor de 1 a 100.";
    } else if (age >= 35 && agility > 85) {
      next.agility = "Use até 85 a partir de 35 anos.";
    }
    technicalFields.forEach(([field]) => {
      const value = Number(draft[field]);
      if (value < 1 || value > 99) {
        next[field] = "Use um valor de 1 a 99.";
      }
    });
    const attributes = technicalFields.map(([field]) => Number(draft[field]));
    if (attributes.reduce((total, value) => total + value, 0) > 480) {
      next.potential = "A soma dos atributos não pode passar de 480.";
    } else if (potential < 1 || potential > 99) {
      next.potential = "Informe o potencial.";
    } else if (potential < Math.max(...attributes)) {
      next.potential = "Deve ser maior que os atributos.";
    } else if (age >= 33 && potential !== Math.max(...attributes)) {
      next.potential = "Deve ser igual ao maior atributo a partir de 33 anos.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const player = await api<Player>("/players", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          position: draft.position as PlayerPosition,
          age: Number(draft.age),
          agility: Number(draft.agility),
          pace: Number(draft.pace),
          shooting: Number(draft.shooting),
          passing: Number(draft.passing),
          dribbling: Number(draft.dribbling),
          defending: Number(draft.defending),
          physical: Number(draft.physical),
          potential: Number(draft.potential),
        }),
      });
      onCreated(player);
    } catch (cause) {
      setErrors({
        name:
          cause instanceof ApiError
            ? cause.message
            : "Verifique os dados do jogador.",
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      title="Novo jogador"
      className="player-create-dialog"
      onClose={onClose}
    >
      <p className="create-intro">
        Preencha os dados e os indicadores técnicos. O valor base, o overall e o
        valor de mercado são calculados ao salvar.
      </p>
      <form className="player-create-form" onSubmit={submit} noValidate>
        <label>
          Nome
          <Input
            className={errors.name ? "input-error" : ""}
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            minLength={3}
            required
          />
        </label>
        {errors.name && <FieldError message={errors.name} />}
        <small className="field-hint">
          De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
        </small>
        <fieldset className="position-picker">
          <legend>Posição</legend>
          <div>
            {playerPositions.map((position) => (
              <button
                key={position}
                type="button"
                className={draft.position === position ? "selected" : ""}
                onClick={() =>
                  setDraft((current) => ({ ...current, position }))
                }
              >
                <b>{position}</b>
                <small>{positionLabel[position]}</small>
              </button>
            ))}
          </div>
        </fieldset>
        {errors.position && <FieldError message={errors.position} />}
        <div className="create-primary-grid">
          <label>
            Idade
            <Input
              className={errors.age ? "input-error" : ""}
              type="number"
              min="16"
              max="45"
              value={draft.age}
              onChange={(event) => setNumber("age", event.target.value)}
              required
            />
            {errors.age && <FieldError message={errors.age} />}
            <small>De 16 a 45 anos.</small>
          </label>
          <label>
            Agilidade
            <Input
              className={errors.agility ? "input-error" : ""}
              type="number"
              min="1"
              max="100"
              value={draft.agility}
              onChange={(event) => setNumber("agility", event.target.value)}
              required
            />
            {errors.agility && <FieldError message={errors.agility} />}
            <small>De 1 a 100 (até 85 com 35 anos ou mais).</small>
          </label>
          <div className="calculated-field">
            <span>Valor base (moedas)</span>
            <b>⌂ Após salvar</b>
            <small>Calculado no cadastro.</small>
          </div>
        </div>
        <div className="technical-section">
          <h3>Indicadores técnicos</h3>
          <p>
            Seis atributos e o potencial, de 1 a 99. Não mudam depois do
            cadastro; a soma dos seis atributos não pode passar de 480.
          </p>
          <div className="technical-layout">
            <div className="technical-fields">
              {technicalFields.map(([field, label]) => (
                <label key={field}>
                  {label}
                  <Input
                    className={errors[field] ? "input-error" : ""}
                    type="number"
                    min="1"
                    max="99"
                    value={draft[field]}
                    onChange={(event) => setNumber(field, event.target.value)}
                    required
                  />
                  {errors[field] && <FieldError message={errors[field]} />}
                </label>
              ))}
              <label>
                Potencial
                <Input
                  className={errors.potential ? "input-error" : ""}
                  type="number"
                  min="1"
                  max="99"
                  value={draft.potential}
                  onChange={(event) =>
                    setNumber("potential", event.target.value)
                  }
                  required
                />
                {errors.potential && <FieldError message={errors.potential} />}
                <small>≥ ao maior atributo; igual a ele com 33+ anos</small>
              </label>
              <div className="calculated-field overall-field">
                <span>Overall</span>
                <b>⌂ Após salvar</b>
                <small>Calculado automaticamente.</small>
              </div>
            </div>
            <aside className="attribute-profile">
              <span>⌁ Perfil dos atributos</span>
              {technicalFields.map(([field, label]) => (
                <div key={field}>
                  <small>{label}</small>
                  <i>
                    <b style={{ width: `${Number(draft[field])}%` }} />
                  </i>
                  <em>{draft[field] || "—"}</em>
                </div>
              ))}
              <p>
                Faixa clara: até o potencial ({draft.potential || "—"}). A prévia só
                desenha os valores digitados, não calcula overall nem valor
                base.
              </p>
            </aside>
          </div>
        </div>
        <footer className="create-footer">
          <small>◉ O jogador começa livre e Apto.</small>
          <div>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={saving}>
              {saving ? "Salvando..." : "Salvar jogador"}
            </Button>
          </div>
        </footer>
      </form>
    </Dialog>
  );
}

export function PlayerDetailsDialog({
  player,
  club,
  onClose,
  onEdit,
  onCondition,
  onBuy,
}: {
  player: Player;
  club?: Club;
  onClose: () => void;
  onEdit: () => void;
  onCondition: () => void;
  onBuy: () => void;
}) {
  const attributes = [
    ["Velocidade", player.pace],
    ["Finalização", player.shooting],
    ["Passe", player.passing],
    ["Drible", player.dribbling],
    ["Defesa", player.defending],
    ["Físico", player.physical],
  ];
  return (
    <div className="player-details-backdrop" onMouseDown={onClose}>
      <aside
        className="player-details-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${player.name}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="details-header">
          <span className={`avatar avatar-${player.id % 4}`}>
            {player.name.split(" ").slice(0, 2).map((name) => name[0]).join("")}
          </span>
          <div>
            <h2>{player.name}</h2>
            <p>
              <span className="position-chip">{player.position}</span>
              <span className={`condition ${player.condition.toLowerCase()}`}>
                ● {conditionLabel[player.condition]}
              </span>
              <span className="free-chip">{club ? club.name : "Livre"}</span>
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="detail-metrics">
          <DetailMetric label="Valor de mercado" value={money(player.market_value)} hint="Calculado automaticamente" icon={<TrendingUp size={14} />} />
          <DetailMetric label="Valor base" value={money(player.base_value)} hint="Calculado no cadastro" icon={<Tag size={14} />} />
          <DetailMetric label="Overall" value={String(player.overall)} hint="Calculado pela posição" icon={<BarChart3 size={14} />} />
          <DetailMetric label="Potencial" value={String(player.potential)} hint="Informado no cadastro" icon={<TrendingUp size={14} />} />
        </div>

        <section className="detail-attributes">
          <header>
            <h3>Indicadores técnicos</h3>
            <small>Escala de 1 a 99</small>
          </header>
          {attributes.map(([label, value]) => (
            <div className="detail-attribute" key={label}>
              <span>{label}</span>
              <i aria-label={`${label}: ${value}`}>
                <em style={{ width: `${player.potential}%` }} />
                <b style={{ width: `${value}%` }} />
              </i>
              <strong>{value}</strong>
            </div>
          ))}
          <p className="attribute-legend"><i /> Valor do atributo <i /> Até o potencial ({player.potential}), que nenhum atributo passa</p>
        </section>

        <dl className="detail-data">
          <div><dt>Idade</dt><dd>{player.age} anos</dd></div>
          <div><dt>Agilidade</dt><dd>{player.agility}</dd></div>
          <div><dt>Clube</dt><dd>{club ? club.name : "Livre"}</dd></div>
        </dl>

        <footer className="details-actions">
          <Button variant="outline" onClick={onEdit}><Pencil size={15} />Editar</Button>
          <Button variant="outline" onClick={onCondition}><HeartPulse size={15} />Alterar condição</Button>
          {!club && <Button onClick={onBuy}><ShoppingCart size={15} />Comprar</Button>}
        </footer>
      </aside>
    </div>
  );
}

function DetailMetric({
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
    <article>
      <span>{label}{icon}</span>
      <b>{value}</b>
      <small>{hint}</small>
    </article>
  );
}

export function PlayerCreatedDialog({
  player,
  onClose,
  onViewDetails,
}: {
  player: Player;
  onClose: () => void;
  onViewDetails: () => void;
}) {
  return (
    <Dialog title="" className="player-created-dialog" onClose={onClose}>
      <span className="created-icon">
        <CheckCircle2 size={20} />
      </span>
      <h2>Jogador cadastrado</h2>
      <p className="created-copy">
        {player.name} entrou livre e Apto. Valores em moedas, calculados pela
        API ao salvar.
      </p>
      <dl className="created-summary">
        <div>
          <dt>Valor base</dt>
          <dd>{money(player.base_value)}</dd>
          <small>Calculado no cadastro; não muda depois</small>
        </div>
        <div>
          <dt>Valor de mercado</dt>
          <dd>{money(player.market_value)}</dd>
          <small>Com condição, agilidade e idade</small>
        </div>
        <div>
          <dt>Overall</dt>
          <dd>{player.overall}</dd>
          <small>Pelos pesos da posição {positionLabel[player.position]}</small>
        </div>
      </dl>
      <div className="dialog-actions">
        <Button variant="outline" onClick={onViewDetails}>
          <Eye size={15} />
          Ver detalhes
        </Button>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Dialog>
  );
}

export function EditPlayerDialog({
  player,
  onClose,
  onSuccess,
}: {
  player: Player;
  onClose: () => void;
  onSuccess: Success;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(player.name);
  const [position, setPosition] = useState(player.position);
  const [age, setAge] = useState(player.age);
  const [agility, setAgility] = useState(player.agility);
  const positionLocked = player.club_id !== null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api<Player>(`/players/${player.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          position,
          age,
          agility,
        }),
      });
      onSuccess("Jogador atualizado com sucesso.");
    } catch (cause) {
      alert(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível atualizar.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      title="Editar jogador"
      className="player-edit-dialog"
      onClose={onClose}
    >
      <p className="dialog-subtitle">
        Edite nome, posição, idade e agilidade. Os demais dados não mudam.
      </p>
      <form className="player-edit-form" onSubmit={submit}>
        <label>
          Nome
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={3}
            required
          />
        </label>
        <small className="field-hint">
          De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
        </small>
        <fieldset className="position-picker">
          <legend>Posição</legend>
          <div>
            {playerPositions.map((item) => (
              <button
                key={item}
                type="button"
                disabled={positionLocked}
                className={position === item ? "selected" : ""}
                onClick={() => setPosition(item)}
              >
                <b>{item}</b>
                <small>{positionLabel[item]}</small>
              </button>
            ))}
          </div>
        </fieldset>
        {positionLocked && (
          <small className="position-locked">
            A posição do clube não muda depois de estar associada. Os atributos
            podem ser desabilitados.
          </small>
        )}
        <div className="edit-primary-grid">
          <label>
            Idade
            <Input
              type="number"
              min="16"
              max="45"
              value={age}
              onChange={(event) => setAge(Number(event.target.value))}
              required
            />
            <small>De 16 a 45, sem diminuir (atual: {player.age}).</small>
          </label>
          <label>
            Agilidade
            <Input
              type="number"
              min="1"
              max="100"
              value={agility}
              onChange={(event) => setAgility(Number(event.target.value))}
              required
            />
            <small>De 1 a 100 (até 85 com 35 anos ou mais).</small>
          </label>
          <div className="calculated-field">
            <span>Valor base (moedas)</span>
            <b>⌂ Após salvar</b>
            <small>Calculado no cadastro.</small>
          </div>
        </div>
        <p className="edit-locked-note">
          ⌂ Não muda depois do cadastro: valor base ({money(player.base_value)}
          ), indicadores e potencial.
        </p>
        <div className="dialog-actions">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ConditionDialog({
  player,
  club,
  onClose,
  onSuccess,
}: {
  player: Player;
  club?: Club;
  onClose: () => void;
  onSuccess: Success;
}) {
  const [saving, setSaving] = useState(false);
  const [condition, setCondition] = useState<PlayerCondition>(player.condition);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api<Player>(`/players/${player.id}/condition`, {
        method: "PATCH",
        body: JSON.stringify({ condition }),
      });
      onSuccess(
        "Condição alterada",
        `${player.name} agora está ${conditionLabel[updated.condition]}. Valor de mercado: ${money(updated.market_value)}.`,
      );
    } catch (cause) {
      alert(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível atualizar.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      title="Alterar condição física"
      className="condition-dialog"
      onClose={onClose}
    >
      <p className="dialog-subtitle">
        A condição muda o desconto do valor de mercado, recalculado ao salvar.
      </p>
      <form className="condition-form" onSubmit={submit}>
        <div className="condition-player">
          <span className={`avatar avatar-${player.id % 4}`}>
            {player.name
              .split(" ")
              .slice(0, 2)
              .map((name) => name[0])
              .join("")}
          </span>
          <span>
            <b>{player.name}</b>
            <small>
              {positionLabel[player.position]} · {player.age} anos
            </small>
          </span>
          <em className={`condition ${player.condition.toLowerCase()}`}>
            ● {conditionLabel[player.condition]}
          </em>
        </div>
        <div className="condition-options">
          <button
            type="button"
            className={condition === "APTO" ? "selected" : ""}
            onClick={() => setCondition("APTO")}
          >
            <Circle size={15} />
            <span>
              <b>Apto</b>
              <small>Sem desconto por condição.</small>
            </span>
          </button>
          <button
            type="button"
            className={
              condition === "MAL_CONDICIONADO" ? "selected warning" : ""
            }
            onClick={() => setCondition("MAL_CONDICIONADO")}
          >
            <Circle size={15} />
            <span>
              <b>Mal condicionado</b>
              <small>
                Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a
                30 soma 10 p.p.
              </small>
            </span>
          </button>
          <button
            type="button"
            className={condition === "DOENTE" ? "selected destructive" : ""}
            onClick={() => setCondition("DOENTE")}
          >
            <Circle size={15} />
            <span>
              <b>Doente</b>
              <small>Desconto de 30%, com o mesmo ajuste de agilidade.</small>
            </span>
          </button>
        </div>
        {condition === "DOENTE" && (
          <aside className="illness-warning">
            <AlertTriangle size={16} />
            <p>
              <b>
                {player.name} {club ? "é titular" : "ficará indisponível"}
              </b>
              <br />
              Ao passar a Doente, ele sai da escalação
              {club
                ? `, e o ${club.name} só volta a jogar partidas depois de escalar de novo os 5 titulares.`
                : "."}
            </p>
          </aside>
        )}
        <div className="dialog-actions">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={saving}>
            {saving ? "Salvando..." : "Salvar condição"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function BuyPlayerDialog({
  player,
  clubs,
  onClose,
  onCompleted,
}: {
  player: Player;
  clubs: Club[];
  onClose: () => void;
  onCompleted: () => void;
}) {
  type PurchaseResult = Transaction & {
    contract: {
      purchase_value: number;
      loyalty_until: string;
      status: "ATIVO";
    };
  };

  const initialDate = new Date();
  initialDate.setFullYear(initialDate.getFullYear() + 1);
  const [clubId, setClubId] = useState("");
  const [loyaltyDate, setLoyaltyDate] = useState(
    initialDate.toISOString().slice(0, 10),
  );
  const [loyaltyTime, setLoyaltyTime] = useState("15:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const marketValue = Number(player.market_value);
  const fee = marketValue > 30 ? marketValue * 0.05 : 0;
  const totalCost = marketValue + fee;
  const selectedClub = clubs.find((club) => club.id === Number(clubId));
  const canAfford = (club: Club) => totalCost <= club.cash / 2;
  const dateIsValid = () => {
    const value = new Date(`${loyaltyDate}T${loyaltyTime}-03:00`);
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + 1095);
    return value > now && value <= limit;
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!selectedClub) {
      setError("Escolha o clube comprador para continuar.");
      return;
    }
    if (!canAfford(selectedClub)) {
      setError("Este clube não possui caixa suficiente para esta compra.");
      return;
    }
    if (!dateIsValid()) {
      setError("Informe uma fidelidade futura de até 1.095 dias.");
      return;
    }
    setSaving(true);
    try {
      const response = await api<PurchaseResult>(`/players/${player.id}/buy`, {
        method: "POST",
        body: JSON.stringify({
          club_id: selectedClub.id,
          loyalty_until: `${loyaltyDate}T${loyaltyTime}-03:00`,
        }),
      });
      setResult(response);
      onCompleted();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "A compra não foi confirmada. Verifique a conexão e tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (result && selectedClub) {
    return (
      <Dialog title="Compra concluída" onClose={onClose} className="purchase-dialog">
        <div className="purchase-success-heading">
          <CheckCircle2 aria-hidden="true" />
          <p>{player.name} agora é do {selectedClub.name}.</p>
        </div>
        <div className="purchase-success-card">
          <PurchaseResultRow
            label="Valor"
            hint="Valor de mercado no momento da compra"
            value={money(result.value)}
          />
          <PurchaseResultRow
            label="Taxa"
            hint={result.fee ? "5% do valor, porque passa de 30,00" : "Sem taxa para valores até 30,00"}
            value={money(result.fee)}
          />
          <PurchaseResultRow
            label="Custo total"
            hint="Valor + taxa"
            value={money(Number(result.value) + Number(result.fee))}
            strong
          />
          <PurchaseResultRow
            label="Fim da fidelidade"
            value={formatContractDate(result.contract.loyalty_until)}
          />
          <PurchaseResultRow
            label="Contrato"
            value={<span className="purchase-active">● ATIVO</span>}
          />
          <PurchaseResultRow
            label={`Novo caixa do ${selectedClub.name}`}
            value={money(result.club_cash)}
            strong
          />
        </div>
        <div className="dialog-actions purchase-success-actions">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              window.location.assign(`/clubs/${selectedClub.id}`);
            }}
          >
            Ver clube →
          </Button>
          <Button type="button" onClick={onClose}>Fechar</Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="Comprar jogador"
      onClose={saving ? () => undefined : onClose}
      className="purchase-dialog"
    >
      <p className="purchase-dialog-copy">
        Escolha o clube comprador e até quando vai a fidelidade do contrato.
      </p>
      {error && (
        <div className="purchase-error" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <b>{error.includes("conexão") ? "Sem conexão" : "Não foi possível confirmar"}</b>
            <p>{error}</p>
          </div>
        </div>
      )}
      <article className="purchase-player-summary">
        <span className={`avatar avatar-${player.id % 4}`}>
          {player.name.split(" ").slice(0, 2).map((name) => name[0]).join("")}
        </span>
        <div>
          <b>{player.name}</b>
          <small>{player.position} · {positionLabel[player.position]} · {player.age} anos</small>
        </div>
        <div>
          <small>Valor de mercado</small>
          <strong>{money(player.market_value)}</strong>
        </div>
      </article>
      <form className="purchase-form" onSubmit={submit}>
        <label>
          Clube comprador
          <Select value={clubId || undefined} onValueChange={setClubId}>
            <SelectTrigger className="purchase-club-select">
              <Shield aria-hidden="true" />
              <SelectValue placeholder="Selecione o clube" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem
                  value={String(club.id)}
                  key={club.id}
                  disabled={!canAfford(club)}
                >
                  {club.name} ({club.acronym}) · caixa {money(club.cash)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <small>
            {selectedClub
              ? `Caixa atual: ${money(selectedClub.cash)}. Custo total: ${money(totalCost)}.`
              : `Custo estimado: ${money(totalCost)}. O clube só pode usar até 50% do caixa.`}
          </small>
        </label>
        <fieldset>
          <legend>Fim da fidelidade</legend>
          <div className="purchase-date-fields">
            <label>
              <CalendarDays aria-hidden="true" />
              <Input
                type="date"
                value={loyaltyDate}
                onChange={(event) => setLoyaltyDate(event.target.value)}
                required
              />
            </label>
            <label>
              <Clock3 aria-hidden="true" />
              <Input
                type="time"
                value={loyaltyTime}
                onChange={(event) => setLoyaltyTime(event.target.value)}
                required
              />
            </label>
          </div>
          <small>
            Depois do momento da compra e até 1.095 dias. Horário de Brasília;
            enviado com o fuso (-03:00).
          </small>
        </fieldset>
        <aside className="purchase-info">
          <Info aria-hidden="true" />
          A taxa é de 5% do valor de mercado, só quando ele passa de 30,00.
          Taxa, custo e novo caixa são calculados ao confirmar.
        </aside>
        {saving && (
          <aside className="purchase-waiting">
            <Info aria-hidden="true" />
            Enviando a compra. Os botões ficam desabilitados até a resposta.
          </aside>
        )}
        <div className="dialog-actions">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button disabled={saving || !clubId}>
            {saving ? <><RefreshCw className="purchase-spin" aria-hidden="true" /> Comprando...</> : <><ShoppingCart aria-hidden="true" /> Confirmar compra</>}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function PurchaseResultRow({
  label,
  hint,
  value,
  strong = false,
}: {
  label: string;
  hint?: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "purchase-result-strong" : ""}>
      <span>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function formatContractDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date).replace(",", ",");
}

export function SellPlayerDialog({
  player,
  club,
  isStarter,
  onClose,
  onCompleted,
  onViewHistory,
}: {
  player: Player;
  club: Club;
  isStarter: boolean;
  onClose: () => void;
  onCompleted: () => void;
  onViewHistory: () => void;
}) {
  type SaleResult = Transaction & {
    purchase_value: number;
    remaining_days: number;
    penalty_rate: number;
    contract_status: "RESCINDIDO" | "ENCERRADO";
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const contract = player.contract;
  const finishSale = async () => {
    setError(null);
    setSaving(true);
    try {
      const response = await api<SaleResult>(`/players/${player.id}/sell`, {
        method: "POST",
      });
      setResult(response);
      onCompleted();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "A venda não foi confirmada. Verifique a conexão e tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    const status = result.contract_status === "RESCINDIDO" ? "RESCINDIDO" : "ENCERRADO";
    return (
      <Dialog title="Venda concluída" onClose={onClose} className="purchase-dialog sale-dialog">
        <div className="purchase-success-heading">
          <CheckCircle2 aria-hidden="true" />
          <p>{player.name} voltou a ficar livre e saiu da escalação.</p>
        </div>
        <div className="purchase-success-card sale-success-card">
          <PurchaseResultRow label="Valor de compra" value={money(result.purchase_value)} />
          <PurchaseResultRow label="Valor de venda" hint="Valor de mercado no momento da venda" value={money(result.value)} />
          <PurchaseResultRow label="Dias restantes" value={String(result.remaining_days)} />
          <PurchaseResultRow label="Multa" hint={`${result.penalty_rate}% do valor de venda, com teto de 10,00`} value={money(result.penalty)} />
          <PurchaseResultRow label="Lucro" value={<span className={result.profit && result.profit >= 0 ? "sale-positive" : ""}>{result.profit === null ? "—" : `${result.profit >= 0 ? "+" : "−"}${money(Math.abs(result.profit))}`}</span>} />
          <PurchaseResultRow label="Comissão" hint="10% do lucro até 10,00 + 20% do que passar" value={money(result.fee)} />
          <PurchaseResultRow label="Crédito no caixa" hint="Valor de venda − multa − comissão" value={`${result.cash_change >= 0 ? "+" : "−"}${money(Math.abs(result.cash_change))}`} strong />
          <PurchaseResultRow label="Contrato" value={<span className={`sale-contract ${status.toLowerCase()}`}>● {status}</span>} />
          <PurchaseResultRow label={`Novo caixa do ${club.name}`} value={money(result.club_cash)} strong />
        </div>
        <div className="dialog-actions purchase-success-actions">
          <Button variant="outline" type="button" onClick={onViewHistory}>
            <Handshake aria-hidden="true" /> Ver histórico
          </Button>
          <Button type="button" onClick={onClose}>Fechar</Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={`Vender ${player.name}?`}
      onClose={saving ? () => undefined : onClose}
      className="purchase-dialog sale-dialog"
    >
      <p className="purchase-dialog-copy">
        O jogador sai do elenco do {club.name} e volta a ficar livre.
      </p>
      {error && (
        <div className="purchase-error" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <b>{error.includes("conexão") ? "Sem conexão" : "A venda foi recusada"}</b>
            <p>{error}</p>
          </div>
        </div>
      )}
      {isStarter && (
        <aside className="sale-starter-warning">
          <AlertTriangle aria-hidden="true" />
          <div>
            <b>{player.name} é titular</b>
            <p>Ao vender, ele sai da escalação, e o {club.name} só volta a jogar partidas depois de escalar de novo os 5 titulares.</p>
          </div>
        </aside>
      )}
      <article className="purchase-player-summary">
        <span className={`avatar avatar-${player.id % 4}`}>
          {player.name.split(" ").slice(0, 2).map((name) => name[0]).join("")}
        </span>
        <div>
          <b>{player.name}</b>
          <small>{player.position} · {positionLabel[player.position]} · {player.age} anos</small>
        </div>
        <div>
          <small>Valor de mercado</small>
          <strong>{money(player.market_value)}</strong>
        </div>
      </article>
      <div className="sale-contract-preview">
        <PurchaseResultRow label="Valor de compra" value={money(contract?.purchase_value)} />
        <PurchaseResultRow label="Fim da fidelidade" value={contract ? formatContractDate(contract.loyalty_until) : "—"} />
        <PurchaseResultRow label="Dias restantes" value={String(contract?.remaining_days ?? 0)} />
        <PurchaseResultRow label="% de multa se vender agora" value={<span className="sale-rate">{contract?.penalty_rate ?? 0}%</span>} />
      </div>
      <aside className="purchase-info">
        <Info aria-hidden="true" />
        A venda é pelo valor de mercado do momento. Multa (teto de 10,00), lucro, comissão e crédito são calculados ao confirmar.
      </aside>
      {saving && (
        <aside className="purchase-waiting">
          <Info aria-hidden="true" />
          Enviando a venda. Os botões ficam desabilitados até a resposta.
        </aside>
      )}
      <div className="dialog-actions sale-actions">
        <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="button" onClick={finishSale} disabled={saving}>
          {saving ? <><RefreshCw className="purchase-spin" aria-hidden="true" /> Vendendo...</> : <><Handshake aria-hidden="true" /> Confirmar venda</>}
        </Button>
      </div>
    </Dialog>
  );
}
