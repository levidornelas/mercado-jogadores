"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { api } from "@/lib/api";
import type { Club, PlayerList } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  useEffect(() => { void Promise.all([api<Club[]>("/clubs"), api<PlayerList>("/players?limit=1"), api<unknown[]>("/matches")]).then(([clubData, players, matches]) => { setClubs(clubData); setPlayerCount(players.meta.total_items); setMatchCount(matches.length); }).catch(() => undefined); }, []);
  return <div className="dashboard"><AppSidebar clubs={clubs} playerCount={playerCount} matchCount={matchCount} /><main className="dashboard-main">{children}</main></div>;
}
