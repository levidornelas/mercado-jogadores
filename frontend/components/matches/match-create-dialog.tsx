"use client";

import { useState } from "react";
import { AlertTriangle, Info, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import type { Club, Match } from "@/lib/types";

export function MatchCreateDialog({
  clubs,
  onClose,
  onPlayed,
}: {
  clubs: Club[];
  onClose: () => void;
  onPlayed: (match: Match) => void;
}) {
  const [homeId, setHomeId] = useState(String(clubs[0]?.id ?? ""));
  const [awayId, setAwayId] = useState(String(clubs[1]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    setError(null);
    if (!homeId || !awayId || homeId === awayId) {
      setError("Escolha dois clubes diferentes para jogar a partida.");
      return;
    }
    setSaving(true);
    try {
      const match = await api<Match>("/matches", {
        method: "POST",
        body: JSON.stringify({
          home_club_id: Number(homeId),
          away_club_id: Number(awayId),
        }),
      });
      onPlayed(match);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível jogar a partida. Verifique a conexão e tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="Nova partida"
      onClose={saving ? () => undefined : onClose}
      className="match-create-dialog"
    >
      <p className="match-dialog-copy">
        Escolha o mandante e o visitante. O placar sai dos atributos dos
        titulares, sem sorteio.
      </p>
      {error && (
        <div className="match-form-error" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <b>Não foi possível jogar a partida</b>
            <p>{error}</p>
          </div>
        </div>
      )}
      <div className="match-form">
        <label>
          Mandante
          <Select
            value={homeId || undefined}
            onValueChange={(value) => {
              setHomeId(value);
              if (value === awayId) setAwayId("");
            }}
          >
            <SelectTrigger className="match-club-select">
              <Swords aria-hidden="true" />
              <SelectValue placeholder="Escolha o mandante" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={String(club.id)}>
                  {club.name} ({club.acronym})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <small>Faz os 3 primeiros ataques.</small>
        </label>
        <label>
          Visitante
          <Select value={awayId || undefined} onValueChange={setAwayId}>
            <SelectTrigger className="match-club-select">
              <Swords aria-hidden="true" />
              <SelectValue placeholder="Escolha o visitante" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem
                  key={club.id}
                  value={String(club.id)}
                  disabled={String(club.id) === homeId}
                >
                  {club.name} ({club.acronym})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <small>Precisa ser um clube diferente do mandante.</small>
        </label>
        <aside className="match-rules">
          <Info aria-hidden="true" />
          <p>
            <b>Como sai o placar</b>
            Cada time faz 3 ataques. Pela ordem do elenco, o 5º jogador de
            linha vai do 1º ao mais recuado ao 4º mais avançado: o 4º enfrenta o
            goleiro, o 3º enfrenta o 1º, o 2º enfrenta o 2º e o 1º enfrenta o
            3º. Atributo de ataque é maior que defesa: é gol. Quando o duelo se
            decide, é gol só quando o ataque é maior. Condição ajusta atributos
            e vale na partida. Os clubes precisam ter os 5 titulares escalados.
          </p>
        </aside>
        {saving && (
          <aside className="match-saving">
            <Info aria-hidden="true" /> Jogando a partida. Os botões ficam
            desabilitados até a resposta.
          </aside>
        )}
        <div className="dialog-actions">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={play} disabled={saving || !homeId || !awayId}>
            <Swords aria-hidden="true" /> {saving ? "Jogando..." : "Jogar partida"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
