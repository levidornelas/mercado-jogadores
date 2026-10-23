"use client";

import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
  confirmIcon?: ReactNode;
  variant?: "primary" | "destructive";
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
  children,
  confirmIcon,
  variant = "primary",
}: ConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog title={title} className="confirm-dialog" onClose={onClose}>
      <p className="confirm-dialog-description">{description}</p>
      {children}
      <footer className="dialog-actions confirm-dialog-actions">
        <Button variant="outline" type="button" onClick={onClose} disabled={confirming}>
          Cancelar
        </Button>
        <Button variant={variant} type="button" onClick={confirm} disabled={confirming}>
          {confirmIcon}
          {confirming ? "Excluindo..." : confirmLabel}
        </Button>
      </footer>
    </Dialog>
  );
}
