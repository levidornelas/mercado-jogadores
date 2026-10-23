"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, ChevronRight, Goal, LayoutList, Plus, Shield, Trophy, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";
import brandMark from "../assets/Marca.png";
import type { Club } from "@/lib/types";

export function AppSidebar({ clubs, playerCount, matchCount }: { clubs: Club[]; playerCount: number; matchCount: number }) {
  const pathname = usePathname();
  const navClass = (path: string) => `sidebar-link ${pathname === path ? "active" : ""}`;
  return <aside className="app-sidebar">
    <Link href="/" className="sidebar-brand"><Image src={brandMark} alt="Passe" /><span><b>Passe</b><small>Gestão da liga</small></span></Link>
    <nav>
      <p className="sidebar-label">Mercado</p>
      <Link href="/players" className={navClass("/players")}><UsersRound />Jogadores <em>{playerCount}</em></Link>
      <Link href="/clubs" className={navClass("/clubs")}><Shield />Clubes <em>{clubs.length}</em></Link>
      <p className="sidebar-label">Liga</p>
      <Link href="/matches" className={navClass("/matches")}><Goal />Partidas <em>{matchCount}</em></Link>
      <Link href="/standings" className={navClass("/standings")}><LayoutList />Classificação</Link>
      <div className="club-heading"><p className="sidebar-label">Clubes</p><button aria-label="Novo clube"><Plus size={16} /></button></div>
      <div className="club-links">{clubs.map((club) => <Link key={club.id} href={`/clubs/${club.id}`} className={pathname === `/clubs/${club.id}` ? "active" : ""}><span>{club.acronym.slice(0, 1)}</span>{club.name}<ChevronRight size={13} /></Link>)}</div>
    </nav>
    <section className="league-card"><div><Trophy /> <span><b>Liga Fictícia 2026</b><small>{clubs.length} clubes · {playerCount} jogadores</small></span></div><div><BarChart3 /> <span><b>Última partida</b><small>Resultados atualizados pela API</small></span></div><footer>◷ Horário de Brasília (UTC−3)</footer></section>
  </aside>;
}
