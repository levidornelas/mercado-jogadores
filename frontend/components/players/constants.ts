import type { PlayerCondition, PlayerPosition } from "@/lib/types";

export const conditionLabel: Record<PlayerCondition, string> = {
  APTO: "Apto",
  MAL_CONDICIONADO: "Mal condicionado",
  DOENTE: "Doente",
};

export const positionLabel: Record<PlayerPosition, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LAT: "Lateral",
  MEI: "Meio-campo",
  ATA: "Atacante",
};

export const playerPositions: PlayerPosition[] = [
  "GOL",
  "ZAG",
  "LAT",
  "MEI",
  "ATA",
];
