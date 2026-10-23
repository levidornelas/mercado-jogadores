"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ListStateProps = {
  status: "loading" | "empty" | "error";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
};

export function ListState({
  status,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
}: ListStateProps) {
  if (status === "loading") {
    return (
      <div className={`list-state list-state-loading ${className}`} role="status">
        <div className="list-state-skeleton" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>{description ?? "Carregando..."}</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`list-state list-state-error ${className}`}>
        <div className="list-state-alert" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>
            <b>{title ?? "Não foi possível carregar a lista"}</b>
            <p>
              Tente de novo. Se a API respondeu, {description ?? "mostre a mensagem dela."}
            </p>
          </span>
        </div>
        {onAction && (
          <Button variant="outline" onClick={onAction}>
            {actionLabel ?? "Tentar de novo"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`list-state list-state-empty ${className}`}>
      <div>
        <b>{title ?? "Nenhum registro encontrado"}</b>
        {description && <p>{description}</p>}
      </div>
      {actionHref ? (
        <Link href={actionHref} className="ui-button ui-button-outline">
          {actionLabel ?? "Criar registro"}
        </Link>
      ) : onAction ? (
        <Button variant="outline" onClick={onAction}>
          {actionLabel ?? "Criar registro"}
        </Button>
      ) : null}
    </div>
  );
}
