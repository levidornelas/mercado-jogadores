"use client";

import { type FormEvent, useState } from "react";
import { AlertCircle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import type { Club } from "@/lib/types";

type Draft = { name: string; acronym: string };
type Errors = Partial<Record<keyof Draft, string>>;

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  const words = draft.name.trim().split(/\s+/).filter(Boolean);
  if (
    draft.name.trim().length < 3 ||
    draft.name.trim().length > 60 ||
    words.length < 2 ||
    words.length > 5
  ) {
    errors.name = "Use de 3 a 60 caracteres e de 2 a 5 palavras.";
  } else if (!/^[\p{L} .-]+$/u.test(draft.name.trim())) {
    errors.name = "Use apenas letras, espaços, hífen e ponto.";
  }
  if (!/^[A-Z]{3}$/.test(draft.acronym)) {
    errors.acronym = "Use 3 letras maiúsculas.";
  }
  return errors;
}

export function ClubCreateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (club: Club) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    name: "",
    acronym: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    setApiError(null);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const club = await api<Club>("/clubs", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      onCreated(club);
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível criar o clube.";
      setApiError(`Não foi possível criar o clube “${draft.name}”. ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="Novo clube" className="club-create-dialog" onClose={onClose}>
      <p className="dialog-subtitle">Informe o nome e a sigla do clube.</p>
      {apiError && (
        <div className="club-form-alert" role="alert">
          <AlertCircle size={15} />
          <span>{apiError}</span>
        </div>
      )}
      <form className="club-create-form" onSubmit={submit} noValidate>
        <label>
          Nome
          <Input
            className={errors.name ? "input-error" : ""}
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Ex.: Leões da Serra"
          />
          {errors.name ? (
            <small className="field-error">ⓘ {errors.name}</small>
          ) : (
            <small>
              De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços,
              hífen e ponto.
            </small>
          )}
        </label>
        <label>
          Sigla
          <Input
            className={errors.acronym ? "input-error" : ""}
            value={draft.acronym}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                acronym: event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 3),
              }))
            }
            placeholder="Ex.: LDS"
            maxLength={3}
          />
          {errors.acronym ? (
            <small className="field-error">ⓘ {errors.acronym}</small>
          ) : (
            <small>
              3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem.
            </small>
          )}
        </label>
        <p className="club-create-note">
          <Info size={14} /> O clube começa com 300,00 em caixa e sem jogadores.
        </p>
        <footer className="dialog-actions">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button disabled={saving}>
            {saving ? "Criando..." : "Criar clube"}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
