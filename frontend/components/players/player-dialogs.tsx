"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Circle,
  Eye,
  HeartPulse,
  Pencil,
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
type CreateDraft = {
  name: string;
  position: PlayerPosition;
  age: number;
  agility: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
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
    name: "Davi Melo",
    position: "MEI",
    age: 25,
    agility: 70,
    pace: 66,
    shooting: 62,
    passing: 74,
    dribbling: 70,
    defending: 48,
    physical: 58,
    potential: 82,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateDraft, string>>
  >({});
  const setNumber = (
    field: Exclude<keyof CreateDraft, "name" | "position">,
    value: string,
  ) => setDraft((current) => ({ ...current, [field]: Number(value) }));
  const validate = () => {
    const next: Partial<Record<keyof CreateDraft, string>> = {};
    if (draft.name.trim().length < 3 || draft.name.trim().length > 100) {
      next.name = "Use de 3 a 100 caracteres.";
    }
    if (draft.age < 16 || draft.age > 45) {
      next.age = "Use uma idade de 16 a 45 anos.";
    }
    if (draft.agility < 1 || draft.agility > 100) {
      next.agility = "Use um valor de 1 a 100.";
    } else if (draft.age >= 35 && draft.agility > 85) {
      next.agility = "Use até 85 a partir de 35 anos.";
    }
    technicalFields.forEach(([field]) => {
      if (draft[field] < 1 || draft[field] > 99) {
        next[field] = "Use um valor de 1 a 99.";
      }
    });
    const attributes = technicalFields.map(([field]) => draft[field]);
    if (attributes.reduce((total, value) => total + value, 0) > 480) {
      next.potential = "A soma dos atributos não pode passar de 480.";
    } else if (draft.potential < 1 || draft.potential > 99) {
      next.potential = "Informe o potencial.";
    } else if (draft.potential < Math.max(...attributes)) {
      next.potential = "Deve ser maior que os atributos.";
    } else if (draft.age >= 33 && draft.potential !== Math.max(...attributes)) {
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
        body: JSON.stringify(draft),
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
                    <b style={{ width: `${draft[field]}%` }} />
                  </i>
                  <em>{draft[field]}</em>
                </div>
              ))}
              <p>
                Faixa clara: até o potencial ({draft.potential}). A prévia só
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
  onSuccess,
}: {
  player: Player;
  clubs: Club[];
  onClose: () => void;
  onSuccess: Success;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const rawDate = String(form.get("loyalty_until"));
    try {
      const result = await api<Transaction>(`/players/${player.id}/buy`, {
        method: "POST",
        body: JSON.stringify({
          club_id: Number(form.get("club_id")),
          loyalty_until: `${rawDate}:00-03:00`,
        }),
      });
      onSuccess(
        `${player.name} foi comprado por ${money(result.value)}. Caixa atual: ${money(result.club_cash)}.`,
      );
    } catch (cause) {
      alert(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível concluir a compra.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog title={`Comprar ${player.name}`} onClose={onClose}>
      <p className="dialog-copy">
        O valor de mercado atual é <b>{money(player.market_value)}</b>. A taxa e
        o custo final serão confirmados pela API.
      </p>
      <form className="player-form" onSubmit={submit}>
        <label>
          Clube
          <select name="club_id" required>
            <option value="">Selecione o clube</option>
            {clubs.map((club) => (
              <option value={club.id} key={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fim da fidelidade
          <Input name="loyalty_until" type="datetime-local" required />
        </label>
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={saving}>
            {saving ? "Comprando..." : "Confirmar compra"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
