export type PlayerCondition = "APTO" | "MAL_CONDICIONADO" | "DOENTE";
export type PlayerPosition = "GOL" | "ZAG" | "LAT" | "MEI" | "ATA";

export type Player = {
  id: number;
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
  condition: PlayerCondition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
};

export type PlayerList = {
  data: Player[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
};

export type Club = {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
};

export type Transaction = {
  id: number;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  club_cash: number;
  player_name: string;
};
