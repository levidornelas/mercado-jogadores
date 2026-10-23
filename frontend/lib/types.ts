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
  contract?: {
    purchase_value: number;
    loyalty_until: string;
    remaining_days: number;
    penalty_rate: number;
  };
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

export type ClubDetail = Club & {
  players: Player[];
};

export type Lineup = {
  club_id: number;
  formation: "3-1" | "2-2" | "2-1-1" | "1-2-1" | null;
  complete: boolean;
  players: Player[];
};

export type Transaction = {
  id: number;
  club_id: number;
  player_id: number;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  club_cash: number;
  player_name: string;
  type: "COMPRA" | "VENDA";
  created_at: string;
};

export type TransactionList = {
  data: Transaction[];
  summary: {
    total_spent: number;
    total_received: number;
    total_fees: number;
    total_penalties: number;
    total_profit: number;
  };
};
