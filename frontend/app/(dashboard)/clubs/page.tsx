"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  Plus,
  RefreshCw,
  Shield,
  X,
  ChevronRight,
} from "lucide-react";

import { ClubCreateDialog } from "@/components/clubs/club-dialogs";
import { Button } from "@/components/ui/button";
import { ListState } from "@/components/ui/list-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { money } from "@/lib/utils";
import type { Club } from "@/lib/types";

type Sort = "name" | "net_worth_desc" | "net_worth_asc";

const sortLabel: Record<Sort, string> = {
  name: "Ordenar: nome",
  net_worth_desc: "Patrimônio (maior para o menor)",
  net_worth_asc: "Patrimônio (menor para o maior)",
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [sort, setSort] = useState<Sort>("net_worth_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClubs(await api<Club[]>(`/clubs?sort=${sort}`));
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível carregar os clubes.",
      );
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <section className="screen clubs-screen">
      <div className="app-topbar">
        <span>▣</span>
        <i />
        <span>Mercado</span>
        <ChevronRight size={14} />
        <b>Clubes</b>
        <button onClick={() => void load()} aria-label="Atualizar">
          <RefreshCw size={17} />
        </button>
      </div>
      <header className="screen-header">
        <div className="screen-title">
          <span className="title-icon">
            <Shield />
          </span>
          <div>
            <h1>Clubes</h1>
            <p>
              Cadastre clubes. Cada clube começa com 300,00 em caixa e sem
              jogadores. A liga aceita no máximo 20 clubes.
            </p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)} disabled={clubs.length >= 20}>
          <Plus size={17} />
          Novo clube
        </Button>
      </header>

      <div className="clubs-card card">
        <div className="club-controls">
          <strong>{clubs.length} clubes </strong>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as Sort)}
          >
            <SelectTrigger className="sort" aria-label="Ordenar clubes">
              <SelectValue>{sortLabel[sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">↕ Ordenar: nome</SelectItem>
              <SelectItem value="net_worth_desc">
                ↕ Patrimônio (maior para o menor)
              </SelectItem>
              <SelectItem value="net_worth_asc">
                ↕ Patrimônio (menor para o maior)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <ListState status="loading" description="Carregando clubes..." />
        ) : error ? (
          <ListState
            status="error"
            title="Não foi possível carregar os clubes"
            description={error}
            onAction={() => void load()}
          />
        ) : clubs.length ? (
          <div className="table-wrap">
            <table className="clubs-table">
              <thead>
                <tr>
                  <th>Clube</th>
                  <th>Sigla</th>
                  <th>Caixa</th>
                  <th>Valor do elenco</th>
                  <th>Patrimônio</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clubs.map((club) => (
                  <tr key={club.id}>
                    <td>
                      <span className="club-name">
                        <em>{club.acronym}</em>
                        <b>{club.name}</b>
                      </span>
                    </td>
                    <td>
                      <span className="club-acronym">{club.acronym}</span>
                    </td>
                    <td>{money(club.cash)}</td>
                    <td>{money(club.squad_value)}</td>
                    <td>
                      <b>{money(club.net_worth)}</b>
                    </td>
                    <td>
                      <Link
                        href={`/clubs/${club.id}`}
                        className="club-view-link"
                      >
                        Ver clube ›
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ListState
            status="empty"
            title="Nenhum clube cadastrado"
            description="Crie o primeiro clube para começar."
            actionLabel="Novo clube"
            onAction={() => setCreating(true)}
          />
        )}
      </div>
      <p className="screen-note">
        Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor,
        com empate desfeito pelo nome.
      </p>
      {creating && (
        <ClubCreateDialog
          onClose={() => setCreating(false)}
          onCreated={(club) => {
            setCreating(false);
            setToast({
              title: "Clube criado",
              description: `${club.name} entrou na liga com ${money(club.cash)} em caixa.`,
            });
            void load();
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          <span>
            <b>{toast.title}</b>
            <small>{toast.description}</small>
          </span>
          <button onClick={() => setToast(null)} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
