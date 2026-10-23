"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  Ellipsis,
  Eye,
  HeartPulse,
  Pencil,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { conditionLabel, positionLabel } from "@/components/players/constants";
import { money } from "@/lib/utils";
import type { Club, Player } from "@/lib/types";

type Props = {
  player: Player;
  club?: Club;
  onDetail: () => void;
  onEdit: () => void;
  onBuy: () => void;
  onCondition: () => void;
  onDelete: () => void;
};

export function PlayerRow({
  player,
  club,
  onDetail,
  onEdit,
  onBuy,
  onCondition,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 218;
    const estimatedHeight = 230;
    const left = Math.max(
      12,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12),
    );
    const shouldOpenUpward =
      window.innerHeight - rect.bottom < estimatedHeight &&
      rect.top > estimatedHeight;

    setMenuPosition(
      shouldOpenUpward
        ? { left, bottom: window.innerHeight - rect.top + 8 }
        : { left, top: rect.bottom + 8 },
    );
  };

  useEffect(() => {
    if (!menuOpen) return;

    updateMenuPosition();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [menuOpen]);

  const runAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  const initials = player.name
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0])
    .join("");
  return (
    <tr>
      <td>
        <div className="player-name">
          <span className={`avatar avatar-${player.id % 4}`}>{initials}</span>
          <span>
            <b>{player.name}</b>
            <small>{positionLabel[player.position]}</small>
          </span>
        </div>
      </td>
      <td>
        <span className="position-chip">{player.position}</span>
      </td>
      <td>
        <b>{player.overall}</b>
      </td>
      <td>
        <div className="agility">
          <span>{player.agility}</span>
          <i style={{ width: `${player.agility}%` }} />
        </div>
      </td>
      <td>{player.age}</td>
      <td>
        <span className={`condition ${player.condition.toLowerCase()}`}>
          ● {conditionLabel[player.condition]}
        </span>
      </td>
      <td className="muted-money">{money(player.base_value)}</td>
      <td>
        <b>{money(player.market_value)}</b>
      </td>
      <td>
        {club ? (
          <span className="club-cell">
            <em>{club.acronym}</em>
            <a href={`/clubs/${club.id}`}>{club.name}</a>
          </span>
        ) : (
          <span className="free-chip">Livre</span>
        )}
      </td>
      <td>
        <div className="row-actions">
          {!club && (
            <Button variant="outline" onClick={onBuy}>
              <ShoppingCart size={16} />
              Comprar
            </Button>
          )}
          <div className="player-menu">
            <button
              ref={triggerRef}
              type="button"
              className="ui-button ui-button-ghost player-menu-trigger"
              aria-label="Mais ações"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Ellipsis size={18} />
            </button>
            {menuOpen &&
              menuPosition &&
              createPortal(
                <div
                  ref={menuRef}
                  className="player-menu-content"
                  style={menuPosition}
                  role="menu"
                >
                  <strong>{player.name}</strong>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(onDetail)}
                  >
                    <Eye size={15} />
                    Ver detalhes
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(onEdit)}
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(onCondition)}
                  >
                    <HeartPulse size={15} />
                    Alterar condição
                  </button>
                  {!club && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => runAction(onBuy)}
                    >
                      <ShoppingCart size={15} />
                      Comprar
                    </button>
                  )}
                  {!club && <hr />}
                  {!club && (
                    <button
                      type="button"
                      role="menuitem"
                      className="destructive-action"
                      onClick={() => runAction(onDelete)}
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  )}
                  {!club && (
                    <small>Disponível porque o jogador está livre.</small>
                  )}
                </div>,
                document.body,
              )}
          </div>
        </div>
      </td>
    </tr>
  );
}
